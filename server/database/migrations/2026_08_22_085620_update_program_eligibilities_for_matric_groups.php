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
        Schema::table('program_eligibilities', function (Blueprint $table) {
            $table->dropForeign('program_eligibilities_program_id_fkey');
            $table->dropForeign('program_eligibilities_inter_group_id_fkey');
            $table->dropPrimary();
        });

        Schema::table('program_eligibilities', function (Blueprint $table) {
            $table->id()->first();
            $table->integer('inter_group_id')->nullable()->change();
            $table->foreignId('matric_group_id')->nullable()->constrained('matric_groups')->onDelete('cascade');
            $table->foreign('program_id', 'program_eligibilities_program_id_fkey')->references('id')->on('programs')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('inter_group_id', 'program_eligibilities_inter_group_id_fkey')->references('id')->on('inter_groups')->onDelete('restrict')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('program_eligibilities', function (Blueprint $table) {
            $table->dropForeign(['matric_group_id']);
            $table->dropColumn('matric_group_id');
            $table->unsignedBigInteger('inter_group_id')->nullable(false)->change();
        });
    }
};
