<?php

$socialiteVerify = filter_var(env('SOCIALITE_VERIFY_SSL', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
$socialiteVerify = $socialiteVerify ?? true;

$socialiteCaBundle = env('SOCIALITE_CA_BUNDLE', env('GEMINI_CA_BUNDLE'));

$socialiteGuzzle = [
    'verify' => $socialiteVerify,
];

if (is_string($socialiteCaBundle) && $socialiteCaBundle !== '' && is_readable($socialiteCaBundle)) {
    $socialiteGuzzle['curl'] = [
        CURLOPT_CAINFO => $socialiteCaBundle,
    ];
}

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
        'guzzle' => $socialiteGuzzle,
    ],

    'google_vision' => [
        'api_key' => env('GOOGLE_VISION_API_KEY'),
        'project_id' => 'fitandsleekpro',
        'credentials_path' => storage_path('credentials/google-vision-sa.json'),
    ],

    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('FACEBOOK_REDIRECT_URI'),
        'guzzle' => $socialiteGuzzle,
    ],

    'twilio' => [
        'sid' => env('TWILIO_SID'),
        'token' => env('TWILIO_TOKEN'),
        'from' => env('TWILIO_FROM'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-1.0-pro'),
        // Optional: path to a CA bundle (PEM). Example: E:\\certs\\cacert.pem
        'ca_bundle' => env('GEMINI_CA_BUNDLE'),
        // Optional: set to false to skip SSL verification (not recommended for prod)
        'verify' => env('GEMINI_VERIFY_SSL', true),
    ],

    'bakong' => [
        'base_url' => env('BAKONG_BASE_URL', 'https://api-bakong.nbc.gov.kh'),
        'token' => env('BAKONG_TOKEN'),
        'merchant_name' => env('BAKONG_MERCHANT_NAME'),
        'merchant_city' => env('BAKONG_MERCHANT_CITY', 'Phnom Penh'),
        'receive_account' => env('BAKONG_RECEIVE_ACCOUNT'),
        'node_binary' => env('KHQR_NODE_BINARY', env('NODE_BINARY', 'node')),
        'currency' => env('BAKONG_CURRENCY', 'KHR'),
        'expired_in' => (int) env('BAKONG_EXPIRES_IN', 300),
        'webhook_secret' => env('BAKONG_WEBHOOK_SECRET'),
        'verify' => env('BAKONG_VERIFY_SSL', true),
        'ca_bundle' => env('BAKONG_CA_BUNDLE', env('GEMINI_CA_BUNDLE')),
    ],

    'aba_payway' => [
        'merchant_id' => env('ABA_PAYWAY_MERCHANT_ID'),
        'api_key' => env('ABA_PAYWAY_API_KEY'),
        'api_secret' => env('ABA_PAYWAY_API_SECRET'),
        'return_url' => env('ABA_PAYWAY_RETURN_URL'),
        'callback_url' => env('ABA_PAYWAY_CALLBACK_URL'),
        'payment_link' => env('ABA_PAYWAY_PAYMENT_LINK'),
    ],

    'image_search' => [
        'vectorize_url' => env('IMAGE_VECTORIZE_URL', 'http://localhost:9000/vectorize'),
        'qdrant_url' => env('QDRANT_URL', 'http://localhost:6333'),
        'qdrant_collection' => env('QDRANT_COLLECTION', 'products'),
        'timeout' => (int) env('IMAGE_SEARCH_TIMEOUT', 120),
    ],

];
