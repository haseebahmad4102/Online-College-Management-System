<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach(['student', 'teacher', 'admin'] as $r) {
    $u = App\Models\User::whereHas('roles', function($q) use ($r) { $q->where('name', $r); })->first();
    echo ucfirst($r) . ' ID: ' . ($u ? $u->id : 'None') . "\n";
}
