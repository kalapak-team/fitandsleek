<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->text('model_info')->nullable()->after('description');
            $table->json('colors')->nullable()->after('model_info');
            $table->text('size_guide')->nullable()->after('colors');
            $table->text('delivery_info')->nullable()->after('size_guide');
            $table->string('support_phone')->nullable()->after('delivery_info');
            $table->json('payment_methods')->nullable()->after('support_phone');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['model_info', 'colors', 'size_guide', 'delivery_info', 'support_phone', 'payment_methods']);
        });
    }
};

