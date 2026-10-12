@echo off
:: ============================================================================
::  GGCM OCMS - one-click setup & run (Windows 10/11)
::  The user only starts Laragon (MySQL). Everything else happens here:
::  checks/installs Node.js, applies DB migrations, loads the default dataset,
::  installs dependencies, and starts backend + frontend.
::  The real logic is the PowerShell payload below the payload marker.
:: ============================================================================
setlocal
set "GGCM_ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content -Raw '%~f0') -split ('#'+'PS_PAYLOAD#'),2)[1]"
exit /b %ERRORLEVEL%
#PS_PAYLOAD#
# ----------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
$Root = $env:GGCM_ROOT.TrimEnd('\')
$Server = Join-Path $Root 'server'
$Client = Join-Path $Root 'client'
$Host.UI.RawUI.WindowTitle = 'GGCM OCMS - Setup & Run'

function Line { Write-Host ('  ' + ('-' * 62)) -ForegroundColor DarkGreen }
function Step($n, $m) { Write-Host ''; Write-Host "  [$n/8] " -ForegroundColor Cyan -NoNewline; Write-Host $m -ForegroundColor White }
function OK($m)   { Write-Host '   [OK] ' -ForegroundColor Green    -NoNewline; Write-Host $m -ForegroundColor Gray }
function Info($m) { Write-Host '    -   ' -ForegroundColor DarkGray -NoNewline; Write-Host $m -ForegroundColor DarkGray }
function Warn($m) { Write-Host '   [!]  ' -ForegroundColor Yellow   -NoNewline; Write-Host $m -ForegroundColor Yellow }
function Fail($m) {
  Write-Host ''; Write-Host "   [X] $m" -ForegroundColor Red; Write-Host ''
  Read-Host '  Press Enter to close'
  exit 1
}
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Test-Port($port) {
  try {
    $c = New-Object Net.Sockets.TcpClient
    $r = $c.BeginConnect('127.0.0.1', $port, $null, $null)
    if ($r.AsyncWaitHandle.WaitOne(1200) -and $c.Connected) { $c.Close(); return $true }
    $c.Close(); return $false
  } catch { return $false }
}
function Ensure-Deps($dir, $label) {
  # Reinstall whenever package-lock.json changed since the last install (a pulled
  # commit added/updated a dependency) - not just when node_modules is missing.
  # Without this, a machine that already ran setup once silently keeps stale
  # node_modules forever and the backend crashes with "Cannot find module 'x'".
  $modules = Join-Path $dir 'node_modules'
  $lock = Join-Path $dir 'package-lock.json'
  $stamp = Join-Path $modules '.install-stamp'
  $needsInstall = -not (Test-Path $modules)
  if (-not $needsInstall -and (Test-Path $lock)) {
    $hash = (Get-FileHash $lock -Algorithm SHA256).Hash
    $needsInstall = -not (Test-Path $stamp) -or ((Get-Content $stamp -Raw -ErrorAction SilentlyContinue).Trim() -ne $hash)
  }
  if ($needsInstall) {
    Info "npm install ($label - first run or dependencies changed)..."
    Run-In $dir npm @('install', '--no-fund', '--no-audit') "$label npm install"
    if (Test-Path $lock) { (Get-FileHash $lock -Algorithm SHA256).Hash | Set-Content -Path $stamp -NoNewline }
    OK "$label dependencies installed"
  } else { OK "$label dependencies already up to date" }
}
function Run-In($dir, $exe, $cmdArgs, $what) {
  Push-Location $dir
  try {
    # Temporarily allow stderr output (warnings) from native commands without
    # treating them as terminating errors. We still check $LASTEXITCODE after.
    $saved = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $exe @cmdArgs 2>&1 | ForEach-Object {
      if ($_ -is [System.Management.Automation.ErrorRecord]) {
        Write-Host ("    " + $_.Exception.Message) -ForegroundColor DarkYellow
      } else { Write-Host $_ }
    }
    $ErrorActionPreference = $saved
    if ($LASTEXITCODE -ne 0) { Fail "$what failed (exit $LASTEXITCODE). Scroll up for details." }
  }
  finally { Pop-Location }
}

Clear-Host
Write-Host ''
Write-Host '  ================================================================' -ForegroundColor Green
Write-Host '           GGCM  ONLINE  COLLEGE  MANAGEMENT  SYSTEM             ' -ForegroundColor Green
Write-Host '              Govt. Graduate College Muzaffargarh                ' -ForegroundColor DarkGreen
Write-Host '                   Setup & Run  -  one click                     ' -ForegroundColor DarkGreen
Write-Host '  ================================================================' -ForegroundColor Green

if (-not (Test-Path (Join-Path $Server 'package.json'))) { Fail 'Run this file from the project folder (server\package.json not found).' }

# -- 1. Node.js --------------------------------------------------------------
Step 1 'Checking Node.js'
Refresh-Path
$phpOk = $false
$php = Get-Command php -ErrorAction SilentlyContinue
if ($php) {
  $phpOutput = & php -v | Out-String
  if ($phpOutput -match 'PHP (\d+\.\d+)') {
    if ([double]$matches[1] -ge 8.2) { OK "PHP v$($matches[1]) found"; $phpOk = $true }
    else { Warn "PHP v$($matches[1]) is too old (need 8.2+) - upgrading" }
  }
}
if (-not $phpOk) {
  Warn 'PHP 8.2+ is not found. Please install PHP or start Laragon/XAMPP.'
}
$composerOk = $false
$composer = Get-Command composer -ErrorAction SilentlyContinue
if ($composer) { OK "Composer found"; $composerOk = $true }
else { Warn "Composer is missing. Please install Composer." }
$nodeOk = $false
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) { OK "Node.js found"; $nodeOk = $true }

if (-not $nodeOk) {
  Info 'Node.js not found - installing automatically...'
  $installed = $false
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Info 'Trying winget (Windows Package Manager)...'
    try {
      winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements | Out-Null
      $installed = $true
    } catch { Warn 'winget failed - trying the next method' }
  }
  if (-not $installed -and (Get-Command choco -ErrorAction SilentlyContinue)) {
    Info 'Trying Chocolatey...'
    try { choco install nodejs-lts -y | Out-Null; $installed = $true } catch { Warn 'Chocolatey failed - trying direct download' }
  }
  if (-not $installed) {
    Info 'Downloading Node.js LTS installer from nodejs.org...'
    $msi = Join-Path $env:TEMP 'node-lts-x64.msi'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi' -OutFile $msi -UseBasicParsing
    Info 'Installing (this may show a UAC prompt)...'
    Start-Process msiexec -ArgumentList '/i', "`"$msi`"", '/qn', '/norestart' -Wait
  }
  Refresh-Path
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { Fail 'Node.js installation did not complete. Install it from https://nodejs.org and run this file again.' }
  OK ('Node.js ' + (& node -v) + ' installed and added to PATH')
}

# -- 2. MySQL ----------------------------------------------------------------
# A port check is NOT enough. A mysqld that failed part-way through startup
# still holds port 3306 open while refusing every connection, so the port looks
# healthy and the migration then fails with "Can't reach database server".
# Readiness here means the server answers a query.
Step 2 'Checking MySQL'
# A wide-open glob picks up any installed version of either stack, rather than one
# hardcoded version string, so it does not silently break when Laragon/XAMPP updates
# its bundled MySQL. Every candidate is actually tried (not just the first one found)
# because both stacks can be *installed* while only one is actually *running* - the
# client for the one that is not running would just error out (e.g. auth-plugin
# mismatch), and it is not safe to assume which is which just from a file existing
# on disk.
$mysqlCandidates = @(
  Get-ChildItem 'C:\xampp\mysql\bin\mysql.exe' -ErrorAction SilentlyContinue
  Get-ChildItem 'C:\laragon\bin\mysql\*\bin\mysql.exe' -ErrorAction SilentlyContinue
) | ForEach-Object { $_.FullName } | Select-Object -Unique

function Test-MySqlServing {
  if ($mysqlCandidates.Count -eq 0) { return (Test-Port 3306) }   # no client found: fall back
  # $ErrorActionPreference is 'Stop' script-wide, which turns a client's stderr
  # output (e.g. the wrong stack's client failing to auth against the other
  # stack's server) into a terminating exception instead of just text in $out -
  # that would abort the whole loop after the first non-matching candidate.
  $saved = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    foreach ($exe in $mysqlCandidates) {
      $out = & $exe -u root -N -e 'SELECT 1;' 2>&1
      if ($out -match '^\s*1\s*$') { return $true }
    }
    return $false
  } finally { $ErrorActionPreference = $saved }
}

if (-not (Test-MySqlServing)) {
  Warn 'MySQL is not answering queries on port 3306.'
  Write-Host ''
  Write-Host '     -> Open the XAMPP (or Laragon) control panel and start MySQL' -ForegroundColor Yellow
  Write-Host '        Wait for it to turn green, then this will continue.' -ForegroundColor DarkGray
  $tries = 0
  while (-not (Test-MySqlServing)) {
    Start-Sleep -Seconds 4
    $tries++
    Write-Host "        still waiting... ($tries)" -ForegroundColor DarkGray
    if ($tries -ge 75) {
      Fail 'MySQL never became serviceable. If the control panel shows it running but this still fails, the data directory is damaged - check C:\xampp\mysql\data\mysql_error.log.'
    }
  }
}
OK 'MySQL is serving on localhost:3306'

# -- 3. Server configuration (.env) ------------------------------------------
Step 3 'Checking server configuration'
$envFile = Join-Path $Server '.env'
if (-not (Test-Path $envFile)) {
  @(
    'DB_CONNECTION=mysql'
    'DB_HOST=127.0.0.1'
    'DB_PORT=3306'
    'DB_DATABASE=ggcm_ocms_v2'
    'DB_USERNAME=root'
    'DB_PASSWORD='
    'CLIENT_URL="http://localhost:5173"'
  ) | Set-Content -Path $envFile -Encoding ascii
  OK 'Created server\.env with default Laragon settings'
} else { OK 'server\.env already present' }

# -- 4. Backend dependencies --------------------------------------------------
Info 'Running composer install...'
Run-In $Server composer @('install') 'Composer install'
OK 'Backend dependencies installed'

# -- 5. Database migrations + default data ------------------------------------
Step 5 'Setting up the database'

# Check if database is populated. If not, import the dump first.
$dbName = 'ggcm_ocms_v2'
$sqlDump = Join-Path $Root 'ggcm_ocms_v2_data.sql'
$isDbEmpty = $true

if (Test-MySqlServing) {
  $savedPref = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  
  # Get first working mysql exe
  $mysqlExe = $null
  foreach ($exe in $mysqlCandidates) {
    if ((& $exe -u root -N -e 'SELECT 1;' 2>&1) -match '^\s*1\s*$') { $mysqlExe = $exe; break }
  }
  if (-not $mysqlExe) { $mysqlExe = 'mysql' }

  # Check if users table exists
  $tableExists = & $mysqlExe -u root -N -e "SELECT count(*) FROM information_schema.tables WHERE table_schema='$dbName' AND table_name='users';" 2>&1
  if ($tableExists -match '^\s*1\s*$') {
    $isDbEmpty = $false
  }
  
  if ($isDbEmpty) {
    Info "Fresh install detected. Creating database and importing $sqlDump (this may take a moment)..."
    & $mysqlExe -u root -e "DROP DATABASE IF EXISTS $dbName; CREATE DATABASE $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 | Out-Null
    if (Test-Path $sqlDump) {
      cmd /c "`"$mysqlExe`" -u root $dbName < `"$sqlDump`""
      OK 'Database restored from dump successfully.'
    } else {
      Warn "Dump file $sqlDump not found! Creating empty schema instead."
    }
  } else {
    OK "Database already populated. Skipping full dump import."
  }
  
  $ErrorActionPreference = $savedPref
}

Info 'Applying migrations to ensure schema is up to date...'
Run-In $Server php @('artisan', 'migrate', '--force') 'Laravel migration'
OK 'Database schema is up to date'

# -- 6. Frontend dependencies -------------------------------------------------
Step 6 'Installing frontend dependencies'
Ensure-Deps $Client 'Frontend'

# -- 7. Start backend + frontend ------------------------------------------------
Step 7 'Starting the application'
if (Test-Port 5000) { OK 'Backend already running on port 5000' }
else {
  Start-Process cmd -ArgumentList '/k', "title GGCM Backend && cd /d `"$Server`" && php artisan serve --port=5000"
  Info 'Backend starting on http://localhost:5000 ...'
}
if (Test-Port 5173) { OK 'Frontend already running on port 5173' }
else {
  Start-Process cmd -ArgumentList '/k', "title GGCM Frontend && cd /d `"$Client`" && npm run dev"
  Info 'Frontend starting on http://localhost:5173 ...'
}
$waited = 0
while ((-not (Test-Port 5000) -or -not (Test-Port 5173)) -and $waited -lt 90) { Start-Sleep -Seconds 2; $waited += 2 }
if ((Test-Port 5000) -and (Test-Port 5173)) { OK 'Both servers are up' } else { Warn 'Servers are still warming up - the browser tab may need a refresh.' }

# -- 8. Open the website --------------------------------------------------------
Step 8 'Opening the college website'
Start-Process 'http://localhost:5173'

Write-Host ''
Line
Write-Host '   READY!' -ForegroundColor Green
Write-Host '   Website:        http://localhost:5173' -ForegroundColor White
Write-Host '   API backend:    http://localhost:5000' -ForegroundColor White
Line
Write-Host '   Logins (password for all: "password")' -ForegroundColor White
Write-Host '     Admin:                admin@ggcm.com' -ForegroundColor Gray
Write-Host '     Principal:            principal@ggcm.com' -ForegroundColor Gray
Write-Host '     Admission clerk:      clerk@ggcm.com' -ForegroundColor Gray
Write-Host '     Librarian:            librarian@ggcm.com' -ForegroundColor Gray
Write-Host '     Timetable controller: timetable@ggcm.com' -ForegroundColor Gray
Write-Host '     Teacher:              teacher@ggcm.com' -ForegroundColor Gray
Write-Host '     Student:              student@ggcm.com' -ForegroundColor Gray
Write-Host '     Applicant:            applicant@ggcm.com' -ForegroundColor Gray
Line
Write-Host '   The two console windows named "GGCM Backend" / "GGCM Frontend"' -ForegroundColor DarkGray
Write-Host '   must stay open while you use the system.' -ForegroundColor DarkGray
Write-Host ''
Read-Host '  Press Enter to close this setup window'
exit 0
