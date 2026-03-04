<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            // Add gender column if it doesn't exist
            if (!Schema::hasColumn('collections', 'gender')) {
                $table->enum('gender', ['men', 'women'])->default('women')->after('name');
            }
            
            // Add sort_order column if it doesn't exist (rename 'order' if needed)
            if (!Schema::hasColumn('collections', 'sort_order')) {
                if (Schema::hasColumn('collections', 'order')) {
                    $table->renameColumn('order', 'sort_order');
                } else {
                    $table->integer('sort_order')->default(0)->after('is_active');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            if (Schema::hasColumn('collections', 'gender')) {
                $table->dropColumn('gender');
            }
            
            if (Schema::hasColumn('collections', 'sort_order')) {
                if (Schema::hasColumn('collections', 'order')) {
                    // Already renamed back, nothing to do
                } else {
                    $table->renameColumn('sort_order', 'order');
                }
            }
        });
    }
};

