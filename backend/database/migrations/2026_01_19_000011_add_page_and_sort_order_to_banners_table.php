<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            if (!Schema::hasColumn('banners', 'page')) {
                $table->string('page')->default('home')->after('id'); // home/women/men/sale
            }
            if (!Schema::hasColumn('banners', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('page');
            }
            if (!Schema::hasColumn('banners', 'position')) {
                $table->string('position')->default('hero')->after('sort_order'); // hero, mid, sidebar, popup
            }
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            if (Schema::hasColumn('banners', 'page')) $table->dropColumn('page');
            if (Schema::hasColumn('banners', 'sort_order')) $table->dropColumn('sort_order');
            if (Schema::hasColumn('banners', 'position')) $table->dropColumn('position');
        });
    }
};
