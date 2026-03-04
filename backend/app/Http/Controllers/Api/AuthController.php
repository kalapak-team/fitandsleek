<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewDeviceLoginAlertMail;
use App\Mail\OtpCodeMail;
use App\Models\OtpCode;
use App\Models\User;
use App\Services\DeviceSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
  public function __construct(private DeviceSessionService $deviceSessionService)
  {
  }

  public function register(Request $request)
  {
    $data = $request->validate([
      'name' => ['required','string','max:120'],
      'email' => ['required','email','max:190','unique:users,email'],
      'phone' => ['nullable','string','max:30'],
      'password' => ['required', 'confirmed', PasswordRule::min(8)],
    ]);

    $user = User::create([
      'name' => $data['name'],
      'email' => $data['email'],
      'password' => Hash::make($data['password']),
      'role' => 'customer',
      'phone' => $data['phone'] ?? null,
      'status' => 'pending',
      'email_verified_at' => null,
    ]);

    $otp = $this->sendOtpCode($user->email, 'register');

    return response()->json([
      'message' => 'Registration pending. OTP sent to email.',
      'otp_required' => true,
      'purpose' => 'register',
      'debug_otp' => $otp,
    ], 201);
  }

  public function login(Request $request)
  {
    $data = $request->validate([
      'email' => ['required','email'],
      'password' => ['nullable','string'],
    ]);

    $user = User::where('email', $data['email'])->first();

    if (!$user) {
      return response()->json(['message' => 'Invalid credentials'], 422);
    }

    if (!empty($data['password']) && !Hash::check($data['password'], $user->password)) {
      return response()->json(['message' => 'Invalid credentials'], 422);
    }

    if (!$user->email_verified_at || $user->status !== 'active') {
      $otp = $this->sendOtpCode($user->email, 'register');
      return response()->json([
        'message' => 'Account not verified. OTP sent to email.',
        'otp_required' => true,
        'purpose' => 'register',
        'debug_otp' => $otp,
      ], 403);
    }

    $otp = $this->sendOtpCode($user->email, 'login');

    return response()->json([
      'message' => 'OTP sent to email.',
      'otp_required' => true,
      'purpose' => 'login',
      'debug_otp' => $otp,
    ]);
  }

  public function verifyOtp(Request $request)
  {
    $data = $request->validate([
      'email' => ['required','email'],
      'code' => ['required','string','min:4','max:12'],
      'purpose' => ['required','in:register,login,forgot'],
    ]);

    $otp = OtpCode::where('email', $data['email'])
      ->where('purpose', $data['purpose'])
      ->whereNull('consumed_at')
      ->where('expires_at', '>', now())
      ->latest('id')
      ->first();

    if (!$otp) {
      return response()->json(['message' => 'OTP expired or not found'], 422);
    }


    $otp->increment('attempts');

    if (!Hash::check($data['code'], $otp->code_hash)) {
      return response()->json(['message' => 'Invalid OTP'], 422);
    }

    // Only consume OTP if not 'forgot' purpose
    if ($data['purpose'] !== 'forgot') {
      $otp->update(['consumed_at' => now()]);
    }

    $user = User::where('email', $data['email'])->first();
    if (!$user) {
      return response()->json(['message' => 'User not found'], 404);
    }

    if ($data['purpose'] === 'register') {
      $user->update([
        'email_verified_at' => now(),
        'status' => 'active',
      ]);
    }

    if ($data['purpose'] !== 'forgot' && $user->status !== 'active') {
      return response()->json(['message' => 'Account is not active'], 403);
    }

    if ($data['purpose'] === 'forgot') {
      return response()->json([
        'verified' => true,
        'message' => 'OTP verified successfully.',
      ]);
    }

    $token = $this->issueDeviceBoundToken($user, 'fitandsleekpro', $request);

    return response()->json([
      'token' => $token,
      'user' => $user,
    ]);
  }

  public function resendOtp(Request $request)
  {
    $data = $request->validate([
      'email' => ['required','email'],
      'purpose' => ['required','in:register,login'],
    ]);

    $otp = $this->sendOtpCode($data['email'], $data['purpose']);

    return response()->json([
      'message' => 'OTP sent to email.',
      'otp_required' => true,
      'purpose' => $data['purpose'],
      'debug_otp' => $otp,
    ]);
  }

  public function me(Request $request)
  {
    return response()->json($request->user());
  }

  public function driverToken(Request $request)
  {
    $user = $request->user();

    if (! $user || $user->role !== 'driver') {
      return response()->json(['message' => 'Forbidden (driver only).'], 403);
    }

    $token = $this->issueDeviceBoundToken($user, 'driver-device', $request);

    return response()->json([
      'token' => $token,
      'user' => $user,
    ]);
  }

  public function logout(Request $request)
  {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out']);
  }

  public function redirectToFacebook()
  {
    return Socialite::driver('facebook')
      ->stateless()
      ->redirect();
  }

  public function handleFacebookCallback(Request $request)
  {
    try {
      $facebookUser = Socialite::driver('facebook')
        ->stateless()
        ->user();
    } catch (\Throwable $e) {
      return response()->json([
        'message' => 'Facebook login failed.',
      ], 422);
    }

    $email = trim((string) $facebookUser->getEmail());
    if ($email === '') {
      return response()->json([
        'message' => 'Facebook account does not provide an email.',
      ], 422);
    }

    $facebookId = (string) $facebookUser->getId();
    $name = $facebookUser->getName() ?: $facebookUser->getNickname() ?: 'Customer';

    $user = User::where('email', $email)->first();

    if (!$user) {
      $user = User::create([
        'name' => $name,
        'email' => $email,
        'password' => null,
        'role' => 'customer',
        'status' => 'active',
        'email_verified_at' => now(),
        'facebook_id' => $facebookId !== '' ? $facebookId : null,
        'social_type' => 'facebook',
      ]);
    } else {
      $updates = [
        'social_type' => 'facebook',
      ];

      if ($facebookId !== '' && empty($user->facebook_id)) {
        $updates['facebook_id'] = $facebookId;
      }

      if (!$user->email_verified_at) {
        $updates['email_verified_at'] = now();
      }

      if ($user->status !== 'active') {
        $updates['status'] = 'active';
      }

      $user->update($updates);
      $user->refresh();
    }

    $token = $this->issueDeviceBoundToken($user, 'facebook-login', $request);

    return response()->json([
      'message' => 'Facebook login successful.',
      'token' => $token,
      'user' => $user,
    ]);
  }

    public function forgotPassword(Request $request)
    {
      $data = $request->validate([
        'email' => ['required', 'email:rfc,dns'],
      ]);

      Password::sendResetLink([
        'email' => $data['email'],
      ]);

      return response()->json([
        'message' => 'If the account exists, a password reset link has been sent.',
      ], 200);
    }

    public function resetPassword(Request $request)
    {
      $data = $request->validate([
        'token' => ['required', 'string'],
        'email' => ['required', 'email:rfc,dns'],
        'password' => [
          'required',
          'confirmed',
          PasswordRule::min(8)->letters()->mixedCase()->numbers()->symbols(),
        ],
      ]);

      $status = Password::reset([
        'email' => $data['email'],
        'token' => $data['token'],
        'password' => $data['password'],
        'password_confirmation' => $request->input('password_confirmation'),
      ], function (User $user, string $password) {
        $user->forceFill([
          'password' => Hash::make($password),
          'remember_token' => Str::random(60),
        ])->save();

        $user->tokens()->delete();
      });

      if ($status === Password::PASSWORD_RESET) {
        return response()->json([
          'message' => 'Password has been reset successfully.',
        ], 200);
      }

      return response()->json([
        'message' => 'The reset token is invalid or expired.',
      ], 422);
    }

  private function sendOtpCode(string $email, string $purpose): ?string
  {
    $expiresMinutes = (int) (config('auth.otp_expires_minutes') ?? 10);
    $code = (string) random_int(100000, 999999);

    OtpCode::where('email', $email)->where('purpose', $purpose)->delete();

    OtpCode::create([
      'email' => $email,
      'purpose' => $purpose,
      'code_hash' => Hash::make($code),
      'expires_at' => now()->addMinutes($expiresMinutes),
    ]);

    Mail::to($email)->send(new OtpCodeMail($code, $purpose, $expiresMinutes));

    return env('OTP_DEBUG', false) ? $code : null;
  }

  private function issueDeviceBoundToken(User $user, string $tokenName, Request $request): string
  {
    $plainTextToken = $user->createToken($tokenName, ['*'], now()->addMonths(6))->plainTextToken;
    $tokenId = (int) explode('|', $plainTextToken, 2)[0];
    $tokenModel = PersonalAccessToken::query()->find($tokenId);

    if ($tokenModel) {
      $binding = $this->deviceSessionService->bindTokenToDevice($user, $tokenModel, $request);

      if ($binding['is_new_device']) {
        Mail::to($user->email)->send(new NewDeviceLoginAlertMail([
          'time' => now()->toDateTimeString(),
          'device_name' => $binding['context']['device_name'] ?? 'Unknown device',
          'browser' => $binding['context']['browser'] ?? 'Unknown browser',
          'os' => $binding['context']['os'] ?? 'Unknown OS',
          'ip_address' => $binding['context']['ip_address'] ?? 'Unknown IP',
        ]));
      }
    }

    return $plainTextToken;
  }
}
