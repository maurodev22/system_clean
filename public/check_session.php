<?php
header("Content-Type: text/plain");
require __DIR__ . "/vendor/autoload.php";
$app = require __DIR__ . "/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Simulate a request to check session
$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);

echo "Session ID: " . session()->getId() . "\n";
echo "CSRF Token: " . csrf_token() . "\n";
echo "Session has token: " . (session()->has("_token") ? "yes" : "no") . "\n";
echo "Cookie: " . ($request->cookie("etecsa_sistemadegestion_session") ? substr($request->cookie("etecsa_sistemadegestion_session"), 0, 30) . "..." : "NOT SET") . "\n";
echo "\nHeaders:\n";
foreach (getallheaders() as $k => $v) {
    echo "  $k: $v\n";
}

