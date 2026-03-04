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
        DB::statement("UPDATE products SET image_url = '' WHERE image_url IS NULL");
        
        // Then change image_url from string(500) to text
        Schema::table('products', function (Blueprint $table) {
            $table->text('image_url')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('image_url', 500)->nullable()->default(null)->change();
        });
    }
};

