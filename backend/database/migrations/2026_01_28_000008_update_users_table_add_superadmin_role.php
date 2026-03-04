<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add status column if it doesn't exist
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->index(); // active, inactive, suspended
            }
            
            // Add profile_image_updated_at if it doesn't exist
            if (!Schema::hasColumn('users', 'profile_image_updated_at')) {
                $table->timestamp('profile_image_updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_image_path', 'profile_image_updated_at', 'status']);
        });
    }
};
