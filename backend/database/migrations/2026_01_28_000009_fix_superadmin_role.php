<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Update any user with null role to 'customer' (should already be default, but just in case)
        DB::table('users')
            ->whereNull('role')
            ->update(['role' => 'customer']);

        // Update superadmin@gmail.com to have superadmin role if it exists
        DB::table('users')
            ->where('email', 'superadmin@gmail.com')
            ->update(['role' => 'superadmin']);

        // Update admin@gmail.com to have admin role if it exists
        DB::table('users')
            ->where('email', 'admin@gmail.com')
            ->update(['role' => 'admin']);

        // Ensure status is set for all users
        DB::table('users')
            ->whereNull('status')
            ->update(['status' => 'active']);
    }

    public function down(): void
    {
        // This migration can't be safely reversed since we don't know original values
        // Just log that it was reversed
    }
};
