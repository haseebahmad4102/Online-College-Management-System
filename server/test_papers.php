<?php
$request = Request::create('/api/examiner/papers/submitted', 'GET');
$user = App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'controller_examiner'))->first();
Auth::login($user);
$response = app()->handle($request);
echo $response->getContent();
