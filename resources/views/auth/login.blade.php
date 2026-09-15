<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Gestion de Salud &mdash; Iniciar Sesion</title>
    <link rel="stylesheet" href="{{ asset('css/main.css') }}?v={{ filemtime(public_path('css/main.css')) }}">
    <link rel="stylesheet" href="{{ asset('css/login.css') }}?v={{ filemtime(public_path('css/login.css')) }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    <div class="login-page">
        <div class="login-card">
            <div class="login-header">
                <h1 class="login-title">Sistema de Gestion de Salud</h1>
                <p class="login-subtitle">Gestion de salud de los Trabajadores</p>
            </div>
            <div class="login-body">
                @if($errors->any())
                    <div class="login-error">{{ $errors->first('username') }}</div>
                @endif
                <div id="loginError" class="login-error"></div>
                <form method="POST" action="{{ route('login.post') }}" id="loginForm" autocomplete="off">
                    @csrf
                    <div class="login-field">
                        <span class="login-input-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        </span>
                        <input type="text" name="username" id="username" class="login-input" placeholder="Usuario"
                               autocomplete="username" required value="{{ old('username') }}">
                    </div>
                    <div class="login-field">
                        <span class="login-input-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                            </svg>
                        </span>
                        <input type="password" name="password" id="password" class="login-input" placeholder="Contrasena"
                               autocomplete="current-password" required style="padding-right:38px">
                        <button type="button" id="togglePassword"
                                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:#555;display:flex;align-items:center;padding:4px">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    </div>
                    <button type="submit" id="loginBtn" class="login-btn">Iniciar Sesion</button>
                </form>
            </div>
            <div class="login-footer">
                Sistema de Gestion de Salud<br>
                Sistema Interno v1.0
            </div>
        </div>
    </div>
    <script src="{{ asset('js/login.js') }}?v={{ filemtime(public_path('js/login.js')) }}"></script>
</body>
</html>
