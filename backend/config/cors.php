<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'auth/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://fitandsleek-frontend.onrender.com', // Frontend របស់អ្នកលើ Render
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // អនុញ្ញាតគ្រប់ Header ទាំងអស់ដើម្បីកុំឱ្យមានបញ្ហាពេល Register

    'exposed_headers' => ['XSRF-TOKEN', 'X-CSRF-TOKEN'],

    'max_age' => 0,

    'supports_credentials' => true,

];
