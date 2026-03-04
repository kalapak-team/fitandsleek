<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('products', function (Blueprint $table) {
      $table->id();
      $table->foreignId('category_id')->constrained()->cascadeOnDelete();

      $table->string('name', 180);
      $table->string('slug', 200)->unique();
      $table->string('sku', 60)->unique();
      $table->text('description')->nullable();

      $table->decimal('price', 12, 2);
      $table->decimal('compare_at_price', 12, 2)->nullable();

      $table->integer('stock')->default(0);
      $table->boolean('is_active')->default(true);

      $table->string('main_image')->nullable();
      $table->jsonb('gallery')->nullable();
      $table->jsonb('attributes')->nullable();

      $table->string('audience', 20)->default('unisex'); // men|women|boy|girl|unisex

      $table->timestamps();

      $table->index(['category_id','is_active','audience']);
    });
  }

  public function down(): void {
    Schema::dropIfExists('products');
  }
};
