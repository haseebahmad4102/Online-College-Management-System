<?php

namespace App\Services;

use App\Models\Setting;

class SettingService
{
    public static function getSetting($key, $fallback = null)
    {
        $setting = Setting::where('key', $key)->first();
        return $setting ? $setting->value : $fallback;
    }

    public static function getNumber($key, $fallback)
    {
        $val = self::getSetting($key);
        if ($val === null || $val === '') return $fallback;
        if (is_numeric($val)) return (float)$val;
        return $fallback;
    }
}
