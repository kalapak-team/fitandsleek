<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('users', function (Blueprint $table) {
      $table->string('role', 20)->default('customer')->index(); // admin|customer
      $table->string('phone', 30)->nullable();
      $table->text('address')->nullable();
    });
  }

  public function down(): void {
    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn(['role','phone','address']);
    });
  }
};
