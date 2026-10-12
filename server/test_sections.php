<?php
$request = Request::create('/api/academic/sections', 'GET');
$response = app()->handle($request);
echo $response->getContent();
