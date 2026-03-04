<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider')->nullable()->index()->after('order_id');
            $table->decimal('amount', 12, 2)->nullable()->after('provider');
            $table->string('currency', 3)->nullable()->after('amount');
            $table->string('bakong_ref')->nullable()->index()->after('currency');
            $table->longText('khqr_payload')->nullable()->after('bakong_ref');
            $table->longText('qr_image_base64')->nullable()->after('khqr_payload');
            $table->timestamp('expires_at')->nullable()->index()->after('qr_image_base64');
            $table->timestamp('paid_at')->nullable()->index()->after('expires_at');
            $table->json('raw_response')->nullable()->after('paid_at');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("DO $$ BEGIN
                ALTER TABLE payments
                ADD CONSTRAINT payments_status_check
                CHECK (status IN ('pending','paid','failed','expired','cancelled','success'));
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("DO $$ BEGIN
                ALTER TABLE payments
                DROP CONSTRAINT IF EXISTS payments_status_check;
            EXCEPTION WHEN undefined_object THEN NULL; END $$;");
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'provider',
                'amount',
                'currency',
                'bakong_ref',
                'khqr_payload',
                'qr_image_base64',
                'expires_at',
                'paid_at',
                'raw_response',
            ]);
        });
    }
};
