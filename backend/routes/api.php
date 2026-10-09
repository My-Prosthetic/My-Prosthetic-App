<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\SpecialistSearchController;
use App\Http\Controllers\WalletEntryController;
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
    Route::get('/wallet-entries', [WalletEntryController::class, 'index'])->name('wallet-entries.index');
    Route::post('/wallet-entries', [WalletEntryController::class, 'store'])->name('wallet-entries.store');
    Route::get('/specialists/search', SpecialistSearchController::class)
        ->middleware('throttle:specialist-search')
        ->name('specialists.search');
    Route::get('/shares', [ShareController::class, 'index'])->name('shares.index');
    Route::post('/shares', [ShareController::class, 'store'])->name('shares.store');
    Route::put('/shares/{specialist}', [ShareController::class, 'update'])
        ->whereUuid('specialist')
        ->name('shares.update');
    Route::delete('/shares/{specialist}', [ShareController::class, 'destroy'])
        ->whereUuid('specialist')
        ->name('shares.destroy');
});
