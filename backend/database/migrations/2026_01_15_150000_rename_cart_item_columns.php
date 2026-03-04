<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    // Rename qty to quantity
    if (Schema::hasColumn('cart_items', 'qty')) {
      Schema::table('cart_items', function (Blueprint $table) {
        $table->renameColumn('qty', 'quantity');
      });
    }

    // Rename price_snapshot to unit_price
    if (Schema::hasColumn('cart_items', 'price_snapshot')) {
      Schema::table('cart_items', function (Blueprint $table) {
        $table->renameColumn('price_snapshot', 'unit_price');
      });
    }
  }

  public function down(): void {
    // Reverse the changes
    if (Schema::hasColumn('cart_items', 'quantity')) {
      Schema::table('cart_items', function (Blueprint $table) {
        $table->renameColumn('quantity', 'qty');
      });
    }

    if (Schema::hasColumn('cart_items', 'unit_price')) {
      Schema::table('cart_items', function (Blueprint $table) {
        $table->renameColumn('unit_price', 'price_snapshot');
      });
    }
  }
};

