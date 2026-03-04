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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'profile_image_path')) {
                $table->string('profile_image_path')->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'profile_image_updated_at')) {
                $table->timestamp('profile_image_updated_at')->nullable()->after('profile_image_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_image_path', 'profile_image_updated_at']);
        });
    }
};
