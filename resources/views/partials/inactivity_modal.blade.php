<!-- Inactivity Modal -->
<div class="modal-overlay" id="inactivityModal">
    <div class="modal" style="max-width:400px">
        <div class="modal-header">
            <span class="modal-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                Sesion Inactiva
            </span>
        </div>
        <div class="modal-body">
            <p style="margin-bottom:16px;color:var(--gray)">Su sesion ha estado inactiva por mas de 5 minutos. Por favor, introduzca sus credenciales para continuar.</p>
            <div id="inactivityError" class="alert alert-error" style="display:none"></div>
            <div class="form-group">
                <label class="form-label">Usuario</label>
                <input type="text" id="inactivityUser" class="form-control" readonly autocomplete="off">
            </div>
            <div class="form-group">
                <label class="form-label">Contrasena</label>
                <input type="password" id="inactivityPass" class="form-control" placeholder="Contrasena" autocomplete="current-password" onkeypress="if(event.key==='Enter')verifyInactivityCredentials()">
            </div>
        </div>
        <div class="modal-footer">
            <a href="{{ route('logout') }}" class="btn btn-secondary" onclick="event.preventDefault();document.getElementById('logout-form').submit();">Cerrar Sesion</a>
            <button class="btn btn-primary" id="inactivityVerifyBtn" onclick="verifyInactivityCredentials()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/></svg>
                Verificar
            </button>
        </div>
    </div>
</div>
