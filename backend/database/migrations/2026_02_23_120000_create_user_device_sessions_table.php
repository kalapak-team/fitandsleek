<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_device_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('personal_access_token_id')->nullable()->constrained('personal_access_tokens')->nullOnDelete();
            $table->string('device_id', 120)->index();
            $table->string('device_name', 190)->nullable();
            $table->string('browser', 120)->nullable();
            $table->string('os', 120)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'device_id']);
            $table->index(['user_id', 'personal_access_token_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_device_sessions');
    }
};
