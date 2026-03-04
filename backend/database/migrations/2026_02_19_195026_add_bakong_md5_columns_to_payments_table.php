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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('bill_number')->nullable()->unique()->after('method');
            $table->string('md5', 64)->nullable()->index()->after('bill_number');
            $table->longText('qr_string')->nullable()->after('khqr_payload');
            $table->json('bakong_data')->nullable()->after('raw_response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_bill_number_unique');
            $table->dropIndex('payments_md5_index');

            $table->dropColumn([
                'bill_number',
                'md5',
                'qr_string',
                'bakong_data',
            ]);
        });
    }
};
