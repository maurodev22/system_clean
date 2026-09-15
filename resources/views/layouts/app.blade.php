<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Gestion de Salud &mdash; @yield('title', 'Trabajadores')</title>
    <link rel="stylesheet" href="{{ asset('css/main.css') }}?v={{ filemtime(public_path('css/main.css')) }}">
    @stack('styles')
    <script src="{{ asset('js/chart.umd.min.js') }}?v={{ filemtime(public_path('js/chart.umd.min.js')) }}"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    <div class="app-wrapper">
        <header class="app-header">
            <div class="header-brand">
                <div class="header-text">
                    <h1>Sistema de Gestion de Salud</h1>
                </div>
            </div>
            <div class="header-actions">
                <div class="user-chip" data-username="{{ Auth::user()->username }}">
                    <div class="user-avatar">{{ strtoupper(substr(Auth::user()->username, 0, 1)) }}</div>
                    <span>{{ Auth::user()->full_name ?: Auth::user()->username }}</span>
                    @if(Auth::user()->role === 'admin')
                        <span class="badge" style="background:rgba(255,255,255,0.2);color:white;font-size:10px">ADMIN</span>
                    @endif
                </div>
                <a href="{{ route('logout') }}" class="btn btn-sm"
                   style="background:rgba(255,0,0,0.2);color:white"
                   onclick="event.preventDefault(); if(confirm('¿Está seguro de que desea cerrar sesión?')) document.getElementById('logout-form').submit();">Salir</a>
                <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display:none">@csrf</form>
            </div>
        </header>

        @yield('content')

        @include('partials.password_expiry')

    </div>

    <script src="{{ asset('js/config.js') }}?v={{ filemtime(public_path('js/config.js')) }}"></script>
    <script src="{{ asset('js/inactivity.js') }}?v={{ filemtime(public_path('js/inactivity.js')) }}"></script>
    <script src="{{ asset('js/login.js') }}?v={{ filemtime(public_path('js/login.js')) }}"></script>
    @stack('scripts')
</body>
</html>
