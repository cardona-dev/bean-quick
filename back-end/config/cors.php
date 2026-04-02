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
    // Aquí es donde está el problema: ¡el frontend!
    'http://localhost:5173',      
    'http://127.0.0.1:5173',      
    'http://127.0.0.1:8000', 
    'https://beanquick.vercel.app',     // Opcional, pero a veces útil
],

    'allowed_origins_patterns' => [],

// Asegúrate de que los headers estén permitidos para el token
'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
