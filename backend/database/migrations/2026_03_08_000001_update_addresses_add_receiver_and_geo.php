<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            if (!Schema::hasColumn('addresses', 'receiver_name')) {
                $table->string('receiver_name')->nullable()->after('label');
            }
            if (!Schema::hasColumn('addresses', 'receiver_phone')) {
                $table->string('receiver_phone')->nullable()->after('receiver_name');
            }
            if (!Schema::hasColumn('addresses', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('country');
            }
            if (!Schema::hasColumn('addresses', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            if (Schema::hasColumn('addresses', 'receiver_name')) {
                $table->dropColumn('receiver_name');
            }
            if (Schema::hasColumn('addresses', 'receiver_phone')) {
                $table->dropColumn('receiver_phone');
            }
            if (Schema::hasColumn('addresses', 'latitude')) {
                $table->dropColumn('latitude');
            }
            if (Schema::hasColumn('addresses', 'longitude')) {
                $table->dropColumn('longitude');
            }
        });
    }
};
