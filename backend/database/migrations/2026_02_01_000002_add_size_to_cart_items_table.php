<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            if (!Schema::hasColumn('cart_items', 'size')) {
                $table->string('size', 40)->nullable()->after('product_id');
            }
            if (Schema::hasColumn('cart_items', 'cart_id') && Schema::hasColumn('cart_items', 'product_id')) {
                $table->dropUnique(['cart_id', 'product_id']);
                $table->unique(['cart_id', 'product_id', 'size']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            if (Schema::hasColumn('cart_items', 'size')) {
                $table->dropColumn('size');
            }
            $table->dropUnique(['cart_id', 'product_id', 'size']);
            $table->unique(['cart_id', 'product_id']);
        });
    }
};
