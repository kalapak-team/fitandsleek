<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuthPasswordResetTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->createTestTables();
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    private function createTestTables(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->string('role')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function test_forgot_password_returns_generic_message_and_sends_reset_link_for_existing_email(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'customer@gmail.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'If the account exists, a password reset link has been sent.',
            ]);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_password_returns_same_generic_message_for_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'unknown@gmail.com',
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'If the account exists, a password reset link has been sent.',
            ]);

        Notification::assertNothingSent();
    }

    public function test_forgot_password_is_rate_limited(): void
    {
        $user = User::factory()->create([
            'email' => 'limit@gmail.com',
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/auth/forgot-password', [
                'email' => $user->email,
            ])->assertOk();
        }

        $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ])->assertStatus(429);
    }

    public function test_reset_password_with_valid_token_updates_password_and_revokes_sanctum_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@gmail.com',
            'password' => Hash::make('OldPassword#123'),
        ]);

        $user->createToken('existing-device-token');
        $this->assertEquals(1, $user->tokens()->count());

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NewPassword#123',
            'password_confirmation' => 'NewPassword#123',
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'Password has been reset successfully.',
            ]);

        $user->refresh();

        $this->assertTrue(Hash::check('NewPassword#123', $user->password));
        $this->assertEquals(0, $user->tokens()->count());
    }

    public function test_reset_password_with_invalid_token_returns_validation_error(): void
    {
        $user = User::factory()->create([
            'email' => 'invalid-token@gmail.com',
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
            'token' => 'invalid-token',
            'password' => 'NewPassword#123',
            'password_confirmation' => 'NewPassword#123',
        ]);

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'The reset token is invalid or expired.',
            ]);
    }
}
