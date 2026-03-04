<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // First set default empty string for NULL values
        DB::statement("UPDATE products SET main_image = '' WHERE main_image IS NULL");
        
        // Then change main_image from string(500) to text
        Schema::table('products', function (Blueprint $table) {
            $table->text('main_image')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('main_image', 500)->nullable()->default(null)->change();
        });
    }
};

