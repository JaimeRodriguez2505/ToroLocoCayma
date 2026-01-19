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

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // Producción - ToroLocoCayma
        'https://torolococayma.com',
        'https://www.torolococayma.com',
        'https://app.torolococayma.com',
        'https://api.torolococayma.com',
        'https://factura.torolococayma.com',
        // Desarrollo local
        'http://localhost:4242',
        'http://localhost:4243',
        'http://localhost:4244',
        'http://127.0.0.1:4242',
        'http://127.0.0.1:4243',
        'http://127.0.0.1:4244',
        'http://localhost:5173',
        'http://161.132.4.27:4242',
        'http://161.132.4.27:4243',
        'http://161.132.4.27:4244',
        'http://161.132.4.27',
    ],

    'allowed_origins_patterns' => [
        // Removido para evitar duplicaciones con allowed_origins
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
