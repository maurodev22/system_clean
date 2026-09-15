<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Administrativo &mdash; Sistema de Gestion de Salud</title>
    <link rel="stylesheet" href="{{ asset('css/main.css') }}?v={{ filemtime(public_path('css/main.css')) }}">
    <link rel="stylesheet" href="{{ asset('css/admin.css') }}?v={{ filemtime(public_path('css/admin.css')) }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    <div class="admin-wrapper">
        <header class="admin-header">
            <div class="admin-logo">
                <div>
                    <h1>Panel Administrativo &mdash; Sistema de Gestion de Salud</h1>
                    <p>Auditoria, usuarios y control del sistema</p>
                </div>
            </div>
            <div class="d-flex gap-3 align-center">
                <div class="user-chip" data-username="{{ Auth::user()->username }}" style="background:rgba(255,255,255,0.15);color:white;display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:20px">
                    <div class="user-avatar" style="background:white;color:var(--blue);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">
                        {{ strtoupper(substr(Auth::user()->username, 0, 1)) }}
                    </div>
                    <span style="font-size:13px">{{ Auth::user()->full_name ?: Auth::user()->username }}</span>
                    <span class="badge" style="background:rgba(255,255,255,0.2);color:white;font-size:10px">ADMIN</span>
                </div>
                <a href="{{ route('logout') }}" class="btn btn-sm"
                   style="background:rgba(255,0,0,0.2);color:white"
                   onclick="event.preventDefault(); if(confirm('¿Está seguro de que desea cerrar sesión?')) document.getElementById('logout-form').submit();">Salir</a>
                <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display:none">@csrf</form>
            </div>
        </header>

        <div class="admin-content">
            <aside class="admin-sidebar">
                <div class="sidebar-menu">
                    <div class="sidebar-section-label">Control</div>
                    <div class="sidebar-item active" onclick="setActiveSection('auditoria', this)">
                        <span class="icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
                        </span> Auditoria
                    </div>
                    <div class="sidebar-item" onclick="setActiveSection('usuarios', this)">
                        <span class="icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        </span> Usuarios
                    </div>
                    <div class="sidebar-section-label" style="margin-top:8px">Exportar</div>
                    <a href="/api/export/pdf/auditoria" target="_blank" class="sidebar-item">
                        <span class="icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 13v4h-2v-4H8l4.01-4L16 15h-3zm0-6V3.5L18.5 9H13z"/></svg>
                        </span> PDF Auditoria
                    </a>
                    <a href="/api/export/excel/auditoria" target="_blank" class="sidebar-item">
                        <span class="icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 16l-5-5 1.41-1.41L13 14.17l4.59-4.58L19 11l-6 6z"/></svg>
                        </span> Excel Auditoria
                    </a>
                    <div class="sidebar-section-label" style="margin-top:8px">Sistema</div>
                    <a href="/manual" target="_blank" class="sidebar-item">
                        <span class="icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>
                        </span> Manual de Usuario
                    </a>
                </div>
            </aside>

            <main class="admin-main" id="adminContent">
                <div class="loading">
                    <div class="spinner"></div>Cargando...
                </div>
            </main>
        </div>
    </div>

    <!-- User Modal -->
    <div class="modal-overlay" id="usuarioModal">
        <div class="modal" style="max-width:500px">
            <div class="modal-header">
                <span class="modal-title" id="usuarioModalTitle">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Nuevo Usuario
                </span>
                <button class="btn-close" onclick="closeModal('usuarioModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div id="usuarioError" class="alert alert-error" style="display:none"></div>
                <form id="usuarioForm" onsubmit="return false">
                    <input type="hidden" name="edit_id" id="usuarioEditId">
                    <div class="form-group">
                        <label class="form-label">Nombre de Usuario *</label>
                        <input type="text" id="usuarioUsername" class="form-control" required minlength="3" placeholder="min. 3 caracteres">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nombre Completo</label>
                        <input type="text" id="usuarioFullName" class="form-control" placeholder="Nombre para mostrar">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contrasena *</label>
                        <input type="password" id="usuarioPassword" class="form-control" minlength="6" placeholder="min. 6 caracteres">
                        <small style="color:var(--gray)">Dejar en blanco para mantener la actual (al editar)</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('usuarioModal')">Cancelar</button>
                <button class="btn btn-primary" onclick="guardarUsuario()">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                    Guardar
                </button>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/config.js') }}?v={{ filemtime(public_path('js/config.js')) }}"></script>
    <script src="{{ asset('js/inactivity.js') }}?v={{ filemtime(public_path('js/inactivity.js')) }}"></script>
    <script src="{{ asset('js/admin.js') }}?v={{ filemtime(public_path('js/admin.js')) }}"></script>
    @include('partials.password_expiry')
    @include('partials.inactivity_modal')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            loadAuditoria();
        });

        function setActiveSection(section, el) {
            document.querySelectorAll('.sidebar-item').forEach(function(i) {
                i.classList.remove('active');
            });
            if (el) el.classList.add('active');
            if (section === 'auditoria') loadAuditoria();
            if (section === 'usuarios') loadUsuarios();
        }
    </script>
</body>
</html>
