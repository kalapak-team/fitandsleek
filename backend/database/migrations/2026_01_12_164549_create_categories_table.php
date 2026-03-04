<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('categories', function (Blueprint $table) {
      $table->id();
      $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
      $table->string('name', 120);
      $table->string('slug', 140)->unique();
      $table->string('image_path')->nullable();
      $table->boolean('is_active')->default(true);
      $table->unsignedInteger('sort_order')->default(0);
      $table->timestamps();

      $table->index(['parent_id','is_active']);
    });
  }

  public function down(): void {
    Schema::dropIfExists('categories');
  }
};
