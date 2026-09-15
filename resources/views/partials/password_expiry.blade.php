@if(session('must_change_password'))
<!-- Password Expired Modal -->
<div class="modal-overlay open" id="passwordExpiryModal">
    <div class="modal" style="max-width:440px">
        <div class="modal-header">
            <span class="modal-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:6px"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                Contrasena Vencida
            </span>
        </div>
        <div class="modal-body">
            <div id="passwordExpiryError" class="alert alert-error" style="display:none"></div>
            <p style="margin-bottom:16px;color:var(--gray)">Su contrasena ha vencido (vigencia de 14 dias desde su creacion). Debe crear una nueva contrasena, <strong>diferente a la anterior</strong>, para continuar.</p>
            <div class="form-group">
                <label class="form-label">Nueva Contrasena</label>
                <input type="password" id="passwordExpiryNew" class="form-control" minlength="6" placeholder="min. 6 caracteres" autocomplete="new-password">
            </div>
            <div class="form-group">
                <label class="form-label">Confirmar Contrasena</label>
                <input type="password" id="passwordExpiryConfirm" class="form-control" minlength="6" placeholder="Repita la contrasena" autocomplete="new-password">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" id="passwordExpiryBtn" onclick="guardarPasswordVencida()">Guardar Nueva Contrasena</button>
        </div>
    </div>
</div>
<script>
    function guardarPasswordVencida() {
        var err = document.getElementById('passwordExpiryError');
        var btn = document.getElementById('passwordExpiryBtn');
        var pass = document.getElementById('passwordExpiryNew').value;
        var confirm = document.getElementById('passwordExpiryConfirm').value;
        err.style.display = 'none';

        if (!pass || pass.length < 6) {
            err.textContent = 'La contrasena debe tener al menos 6 caracteres';
            err.style.display = 'block';
            return;
        }
        if (pass === '123456') {
            err.textContent = 'La contrasena no puede ser 123456';
            err.style.display = 'block';
            return;
        }
        if (pass !== confirm) {
            err.textContent = 'Las contrasenas no coinciden';
            err.style.display = 'block';
            return;
        }

        var csrf = document.querySelector('meta[name="csrf-token"]');
        var token = csrf ? csrf.content : '';
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        fetch('/api/cambiar-password', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ password: pass })
        })
        .then(function(res) { return res.json().then(function(json) { return { ok: res.ok, json: json }; }); })
        .then(function(result) {
            if (result.json.success) {
                window.location.reload();
            } else {
                err.textContent = result.json.error || 'Error al cambiar la contrasena';
                err.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Guardar Nueva Contrasena';
            }
        })
        .catch(function(e) {
            err.textContent = 'Error de conexion al intentar acceder a /api/cambiar-password: ' + (e && e.message ? e.message : 'sin detalle');
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Guardar Nueva Contrasena';
        });
    }
</script>
@endif
