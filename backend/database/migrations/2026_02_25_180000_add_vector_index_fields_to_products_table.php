<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'is_vector_indexed')) {
                $table->boolean('is_vector_indexed')->default(false)->after('is_active');
            }

            if (!Schema::hasColumn('products', 'vector_indexed_at')) {
                $table->timestamp('vector_indexed_at')->nullable()->after('is_vector_indexed');
            }

            if (!Schema::hasColumn('products', 'vector_index_error')) {
                $table->text('vector_index_error')->nullable()->after('vector_indexed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'vector_index_error')) {
                $table->dropColumn('vector_index_error');
            }

            if (Schema::hasColumn('products', 'vector_indexed_at')) {
                $table->dropColumn('vector_indexed_at');
            }

            if (Schema::hasColumn('products', 'is_vector_indexed')) {
                $table->dropColumn('is_vector_indexed');
            }
        });
    }
};
