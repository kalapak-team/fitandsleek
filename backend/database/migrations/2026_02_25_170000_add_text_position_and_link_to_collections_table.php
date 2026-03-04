<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            if (!Schema::hasColumn('collections', 'text_position')) {
                $table->string('text_position', 20)->default('overlay')->after('image_url');
            }

            if (!Schema::hasColumn('collections', 'link')) {
                $table->string('link', 255)->nullable()->after('text_position');
            }
        });
    }

    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            if (Schema::hasColumn('collections', 'link')) {
                $table->dropColumn('link');
            }

            if (Schema::hasColumn('collections', 'text_position')) {
                $table->dropColumn('text_position');
            }
        });
    }
};
