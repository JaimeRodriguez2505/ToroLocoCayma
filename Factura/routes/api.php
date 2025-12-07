<?php

use App\Http\Controllers\Api\InvoiceController;
use App\Http\Middleware\VerifyJwtToken;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check endpoint (sin autenticación)
Route::get('health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'facturador',
        'timestamp' => now()->toISOString(),
    ]);
});

// Test CORS endpoint (sin autenticación para pruebas)
Route::get('cors-test', function (Request $request) {
    return response()->json([
        'cors' => 'ok',
        'origin' => $request->header('Origin'),
        'method' => $request->method(),
        'timestamp' => now()->toISOString(),
    ]);
});

// Rutas protegidas con JWT
Route::post('invoices/send',[InvoiceController::class,'send'])->middleware(VerifyJwtToken::class);

Route::post('invoices/xml',[InvoiceController::class,'xml'])->middleware(VerifyJwtToken::class);

Route::post('invoices/pdf',[InvoiceController::class,'pdf'])->middleware(VerifyJwtToken::class);