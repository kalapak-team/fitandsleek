<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('addresses', 'house_no')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->string('house_no')->nullable()->after('receiver_phone');
            });
        }

        if (!Schema::hasColumn('addresses', 'street_no')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->string('street_no')->nullable()->after('house_no');
            });
        }

        if (!Schema::hasColumn('addresses', 'sangkat')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->string('sangkat')->nullable()->after('street_no');
            });
        }

        if (!Schema::hasColumn('addresses', 'khan')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->string('khan')->nullable()->after('sangkat');
            });
        }

        if (!Schema::hasColumn('addresses', 'province')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->string('province')->nullable()->after('khan');
            });
        }

        if (!Schema::hasColumn('addresses', 'landmark')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->text('landmark')->nullable()->after('province');
            });
        }

        if (
            Schema::hasColumn('addresses', 'house_no')
            && Schema::hasColumn('addresses', 'street_no')
            && Schema::hasColumn('addresses', 'sangkat')
            && Schema::hasColumn('addresses', 'khan')
            && Schema::hasColumn('addresses', 'province')
        ) {
            DB::table('addresses')
                ->whereNull('house_no')
                ->update([
                    'house_no' => '-',
                    'street_no' => DB::raw("COALESCE(NULLIF(street, ''), '-')"),
                    'sangkat' => DB::raw("COALESCE(NULLIF(city, ''), '-')"),
                    'khan' => DB::raw("COALESCE(NULLIF(state, ''), '-')"),
                    'province' => DB::raw("COALESCE(NULLIF(country, ''), '-')"),
                ]);
        }
    }

    public function down(): void
    {
        $dropColumns = array_values(array_filter([
            'house_no',
            'street_no',
            'sangkat',
            'khan',
            'province',
            'landmark',
        ], fn (string $column) => Schema::hasColumn('addresses', $column)));

        if (!empty($dropColumns)) {
            Schema::table('addresses', function (Blueprint $table) use ($dropColumns) {
                $table->dropColumn($dropColumns);
            });
        }
    }
};
