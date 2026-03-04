<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // add only if missing in your schema
            if (!Schema::hasColumn('products', 'image_url')) {
                $table->string('image_url', 500)->nullable()->after('price');
            }
            if (!Schema::hasColumn('products', 'stock')) {
                $table->unsignedInteger('stock')->default(0)->after('image_url');
            }
            if (!Schema::hasColumn('products', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('stock');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'is_active')) $table->dropColumn('is_active');
            if (Schema::hasColumn('products', 'stock')) $table->dropColumn('stock');
            if (Schema::hasColumn('products', 'image_url')) $table->dropColumn('image_url');
        });
    }
};
