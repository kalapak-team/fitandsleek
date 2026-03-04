<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'text_position')) {
                $table->enum('text_position', ['top','overlay','bottom'])->default('bottom')->after('description');
            }
            if (!Schema::hasColumn('products', 'brand_id')) {
                $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete()->after('category_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'text_position')) $table->dropColumn('text_position');
            if (Schema::hasColumn('products', 'brand_id')) $table->dropConstrainedForeignId('brand_id');
        });
    }
};
