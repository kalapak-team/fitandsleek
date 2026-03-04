<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('banners', function (Blueprint $table) {
      $table->id();
      $table->string('title', 200)->nullable();
      $table->string('subtitle', 200)->nullable();
      $table->text('image_url')->nullable();
      $table->string('link_url', 500)->nullable();
      $table->string('position', 50)->default('hero'); // hero|mid|popup|sidebar
      $table->boolean('is_active')->default(true);
      $table->integer('order')->default(0);
      $table->timestamps();
    });
  }

  public function down(): void {
    Schema::dropIfExists('banners');
  }
};

