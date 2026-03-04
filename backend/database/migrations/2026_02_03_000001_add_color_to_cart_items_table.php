<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            if (!Schema::hasColumn('cart_items', 'color')) {
                $table->string('color', 40)->nullable()->after('size');
            }
            if (Schema::hasColumn('cart_items', 'cart_id') && Schema::hasColumn('cart_items', 'product_id') && Schema::hasColumn('cart_items', 'size')) {
                $table->dropUnique(['cart_id', 'product_id', 'size']);
                $table->unique(['cart_id', 'product_id', 'size', 'color']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique(['cart_id', 'product_id', 'size', 'color']);
            if (Schema::hasColumn('cart_items', 'color')) {
                $table->dropColumn('color');
            }
            if (Schema::hasColumn('cart_items', 'cart_id') && Schema::hasColumn('cart_items', 'product_id') && Schema::hasColumn('cart_items', 'size')) {
                $table->unique(['cart_id', 'product_id', 'size']);
            }
        });
    }
};
