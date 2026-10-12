<?php

namespace App\Services;

use App\Models\Notification;

class NotifyService
{
    public static function notify($userId, $type, $title, $body = null, $link = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link
        ]);
    }
}
