<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$routes = \Illuminate\Support\Facades\Route::getRoutes();

$users = [
    'Admin' => App\Models\User::find(1),
    'Teacher' => App\Models\User::find(6),
    'Student' => App\Models\User::find(96)
];

$errors = [];
$total = 0;

foreach ($users as $roleName => $user) {
    if (!$user) {
        echo "Could not find $roleName user.\n";
        continue;
    }
    
    foreach ($routes as $route) {
        if (!in_array('GET', $route->methods()) && !in_array('POST', $route->methods()) && !in_array('PUT', $route->methods())) continue;
        
        $uri = $route->uri();
        
        // Skip routes that require parameters for now, or mock them if they are simple {id}
        if (str_contains($uri, '{')) {
            $uri = preg_replace('/\{[^\}]+\}/', '1', $uri);
        }
        
        // We will test GET, POST, PUT to find 500 errors.
        foreach (['GET', 'POST', 'PUT'] as $method) {
            if (!in_array($method, $route->methods())) continue;
            
            $request = Illuminate\Http\Request::create($uri, $method);
            $app->instance('request', $request);
            $request->headers->set('Accept', 'application/json');
            $app->make('auth')->guard('sanctum')->setUser($user);
            $request->setUserResolver(function () use ($user) { return $user; });
            
            try {
                $response = $kernel->handle($request);
                $status = $response->getStatusCode();
                
                // We only care about 500 errors (Crashes)
                if ($status >= 500) {
                    $errors[] = "[$roleName] $method /$uri -> $status\nResponse: " . substr(strip_tags($response->getContent()), 0, 500);
                }
            } catch (\Exception $e) {
                $errors[] = "[$roleName] $method /$uri -> EXCEPTION: " . $e->getMessage();
            }
            $total++;
        }
    }
}

echo "Tested $total requests.\n";
if (empty($errors)) {
    echo "All good! No 500 errors found.\n";
} else {
    echo "Found " . count($errors) . " errors:\n";
    foreach ($errors as $err) {
        echo "====================================\n$err\n";
    }
}
