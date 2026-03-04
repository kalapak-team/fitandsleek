<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE collections ALTER COLUMN gender TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE collections ALTER COLUMN gender SET DEFAULT 'women'");
            DB::statement("ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_gender_check");
            DB::statement("ALTER TABLE collections ADD CONSTRAINT collections_gender_check CHECK (gender IN ('men','women','boys','girls'))");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE collections MODIFY gender ENUM('men','women','boys','girls') NOT NULL DEFAULT 'women'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_gender_check");
            DB::statement("ALTER TABLE collections ADD CONSTRAINT collections_gender_check CHECK (gender IN ('men','women'))");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE collections MODIFY gender ENUM('men','women') NOT NULL DEFAULT 'women'");
        }
    }
};
