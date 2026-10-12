<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('matric_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->timestamps();
        });

        // Insert default data
        DB::table('matric_groups')->insert([
            ['name' => 'Science (Biology)', 'code' => 'SCI-BIO', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Science (Computer)', 'code' => 'SCI-COMP', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Arts/Humanities', 'code' => 'ARTS', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matric_groups');
    }
};
