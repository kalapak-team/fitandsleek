<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'link_url')) {
                $table->string('link_url')->nullable()->after('content');
            }

            if (! Schema::hasColumn('messages', 'media_url')) {
                $table->string('media_url')->nullable()->after('link_url');
            }

            if (! Schema::hasColumn('messages', 'media_type')) {
                $table->enum('media_type', ['image', 'video'])->nullable()->after('media_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $columnsToDrop = collect(['link_url', 'media_url', 'media_type'])
                ->filter(fn ($column) => Schema::hasColumn('messages', $column))
                ->all();

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
