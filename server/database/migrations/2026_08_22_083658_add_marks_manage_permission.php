<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('permissions')->updateOrInsert(
            ['name' => 'marks.manage'],
            [
                'group' => 'academic',
                'label' => 'Override and Manage All Student Marks'
            ]
        );
    }

    public function down(): void
    {
        DB::table('permissions')->where('name', 'marks.manage')->delete();
    }
};
