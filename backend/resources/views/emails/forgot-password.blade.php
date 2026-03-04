<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password</title>
</head>
<body>
    <h2>Hello, {{ $user->name ?? $user->email }}</h2>
    <p>You requested a password reset for your Fit & Sleek account.</p>
    <p>Click the link below to reset your password:</p>
    <p>
        <a href="{{ url('/reset-password?token=' . $token . '&email=' . urlencode($user->email)) }}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a>
    </p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Thank you,<br>Fit & Sleek Team</p>
</body>
</html>
