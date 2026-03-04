<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('collections', function (Blueprint $table) {
      $table->id();
      $table->string('name', 100);
      $table->string('slug', 100)->unique();
      $table->text('description')->nullable();
      $table->text('image_url')->nullable();
      $table->jsonb('category_ids')->nullable();
      $table->boolean('is_active')->default(true);
      $table->integer('order')->default(0);
      $table->timestamps();
    });
  }

  public function down(): void {
    Schema::dropIfExists('collections');
  }
};

