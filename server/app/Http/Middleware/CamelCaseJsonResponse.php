<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CamelCaseJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $data = $response->getData(true);
            
            if (is_array($data)) {
                $response->setData($this->camelCaseArrayKeys($data));
            }
        }

        return $response;
    }

    private function camelCaseArrayKeys(array $array): array
    {
        $result = [];
        
        foreach ($array as $key => $value) {
            // Keep _count as is if it was explicitly defined
            if ($key === '_count') {
                if (!isset($result['_count'])) $result['_count'] = [];
                $result['_count'] = array_merge($result['_count'], $value);
                continue;
            }

            // Target Laravel's withCount() output which produces snake_case ending in '_count'
            if (is_string($key) && str_ends_with($key, '_count') && $key !== '_count') {
                $relation = Str::camel(substr($key, 0, -6));
                if (!isset($result['_count'])) $result['_count'] = [];
                $result['_count'][$relation] = $value;
                continue;
            }

            $camelKey = is_string($key) ? Str::camel($key) : $key;
            
            if (is_array($value)) {
                $result[$camelKey] = $this->camelCaseArrayKeys($value);
            } else {
                $result[$camelKey] = $value;
            }
        }
        
        return $result;
    }
}
