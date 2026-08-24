<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:auth')
    ->name('auth.register');

Route::post('/login', [AuthController::class, 'mobileLogin'])
    ->middleware('throttle:auth')
    ->name('auth.mobile-login');

Route::post('/web/login', [AuthController::class, 'webLogin'])
    ->middleware('throttle:auth')
    ->name('auth.web-login');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/profile', [AuthController::class, 'profile'])->name('auth.profile');
    Route::post('/logout', [AuthController::class, 'mobileLogout'])->name('auth.mobile-logout');
    Route::post('/web/logout', [AuthController::class, 'webLogout'])->name('auth.web-logout');
});
