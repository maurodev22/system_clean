<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\DonanteController;
use App\Http\Controllers\AuditoriaController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\ImportController;

Route::get('/', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post')->middleware('throttle:5,1');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::post('/auth/keep-alive', [AuthController::class, 'keepAlive']);

    Route::middleware(['role:especialista,admin'])->group(function () {
        Route::get('/user/dashboard', [TrabajadorController::class, 'userDashboard'])->name('user.dashboard');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin/dashboard', [TrabajadorController::class, 'adminDashboard'])->name('admin.dashboard');
    });
});

Route::prefix('api')->middleware(['auth'])->group(function () {
    Route::middleware(['role:especialista,admin'])->group(function () {
        Route::get('/trabajadores', [TrabajadorController::class, 'index']);
        Route::get('/trabajadores/maternidad', [TrabajadorController::class, 'maternidad']);
        Route::get('/trabajadores/unidades-organizativas', [TrabajadorController::class, 'unidadesOrganizativas']);
        Route::get('/trabajadores/{id}', [TrabajadorController::class, 'show']);
        Route::post('/trabajadores', [TrabajadorController::class, 'store']);
        Route::put('/trabajadores/{id}', [TrabajadorController::class, 'update']);
        Route::put('/trabajadores/{id}/maternidad', [TrabajadorController::class, 'updateMaternidad']);
        Route::get('/trabajadores/search/{query}', [TrabajadorController::class, 'search']);
        Route::get('/trabajadores/division/{id}', [TrabajadorController::class, 'byDivision']);
        Route::get('/trabajadores/stats/overview', [TrabajadorController::class, 'stats']);
        Route::get('/trabajadores/stats/custom', [TrabajadorController::class, 'customStats']);
        Route::get('/trabajadores/stats/vencidos', [TrabajadorController::class, 'vencidos']);
        Route::get('/trabajadores/export/all', [TrabajadorController::class, 'exportAll']);
        Route::post('/trabajadores/import/preview', [ImportController::class, 'preview']);
        Route::post('/trabajadores/import/execute', [ImportController::class, 'execute']);
        Route::post('/trabajadores/import/check-duplicates', [ImportController::class, 'checkDuplicates']);

        Route::get('/choferes', [TrabajadorController::class, 'choferes']);
        Route::get('/choferes/stats', [TrabajadorController::class, 'choferesStats']);

        Route::get('/divisiones', [TrabajadorController::class, 'divisiones']);
        Route::get('/enfermedades', [TrabajadorController::class, 'enfermedades']);
        Route::get('/posiciones', [TrabajadorController::class, 'posiciones']);

        Route::post('/bloqueos/check', [TrabajadorController::class, 'checkLock']);
        Route::post('/bloqueos/acquire', [TrabajadorController::class, 'acquireLock']);
        Route::post('/bloqueos/release', [TrabajadorController::class, 'releaseLock']);

        Route::post('/cambiar-password', [UsuarioController::class, 'cambiarPassword']);

        Route::get('/donantes', [DonanteController::class, 'index']);
        Route::get('/donantes/search', [DonanteController::class, 'search']);
        Route::get('/donantes/check-worker/{trabajadorId}', [DonanteController::class, 'checkWorker']);
        Route::get('/donantes/stats/overview', [DonanteController::class, 'stats']);
        Route::get('/donantes/{id}', [DonanteController::class, 'show']);
        Route::post('/donantes', [DonanteController::class, 'store']);
        Route::put('/donantes/{id}', [DonanteController::class, 'update']);
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/auditoria', [AuditoriaController::class, 'index']);
        Route::get('/auditoria/stats', [AuditoriaController::class, 'stats']);
        Route::get('/usuarios', [UsuarioController::class, 'index']);
        Route::post('/usuarios', [UsuarioController::class, 'store']);
        Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);
    });

    Route::get('/export/{format}/{type}', [ExportController::class, 'export']);
});

Route::get('/manual', function () {
    $manualPath = base_path('php/manual.php');
    if (file_exists($manualPath)) {
        require $manualPath;
    } else {
        abort(404, 'Manual no disponible');
    }
    exit;
});
