<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('orders', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();

      $table->string('order_number', 40)->unique();
      $table->string('status', 30)->default('pending'); // pending|paid|shipped|completed|cancelled
      $table->string('payment_status', 30)->default('unpaid');

      $table->decimal('subtotal', 12, 2);
      $table->decimal('shipping', 12, 2)->default(0);
      $table->decimal('discount', 12, 2)->default(0);
      $table->decimal('total', 12, 2);

      $table->jsonb('shipping_address')->nullable();
      $table->jsonb('billing_address')->nullable();

      $table->timestamps();

      $table->index(['user_id','status']);
    });
  }

  public function down(): void {
    Schema::dropIfExists('orders');
  }
};
