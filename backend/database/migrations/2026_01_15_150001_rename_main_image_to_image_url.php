<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
  public function up(): void {
    // Check if main_image exists AND image_url does not exist
    $hasMainImage = Schema::hasColumn('products', 'main_image');
    $hasImageUrl = Schema::hasColumn('products', 'image_url');
    
    if ($hasMainImage && !$hasImageUrl) {
      Schema::table('products', function (Blueprint $table) {
        $table->renameColumn('main_image', 'image_url');
      });
    }
  }

  public function down(): void {
    // Reverse the changes
    $hasImageUrl = Schema::hasColumn('products', 'image_url');
    $hasMainImage = Schema::hasColumn('products', 'main_image');
    
    if ($hasImageUrl && !$hasMainImage) {
      Schema::table('products', function (Blueprint $table) {
        $table->renameColumn('image_url', 'main_image');
      });
    }
  }
};

