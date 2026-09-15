// ============================================================
// inactivity.js - Control de inactividad de sesion (5 minutos)
// Compartido por el panel de usuario y el panel admin.
// - Avisa a los 4 minutos y bloquea a los 5 sin interaccion.
// - Mantiene viva la sesion del servidor con /auth/keep-alive
//   (cada 30s) mientras hay actividad.
// - Re-autenticacion via modal con manejo de errores 429/401.
// ============================================================

var INACTIVITY_TIMEOUT = 300000;   // 5 min
var INACTIVITY_WARNING = 240000;   // 4 min (aviso 1 min antes)
var KEEPALIVE_INTERVAL = 30000;    // 30 s

var inactivityTimer = null;
var inactivityWarningTimer = null;
var keepAliveTimer = null;
var _lastInactivityReset = 0;

function resetInactivityTimer() {
    var modal = document.getElementById('inactivityModal');
    if (modal && modal.classList.contains('open')) return;
    var now = Date.now();
    if (_lastInactivityReset && now - _lastInactivityReset < 5000) return;
    _lastInactivityReset = now;
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (inactivityWarningTimer) clearTimeout(inactivityWarningTimer);
    hideInactivityWarning();
    inactivityWarningTimer = setTimeout(showInactivityWarning, INACTIVITY_WARNING);
    inactivityTimer = setTimeout(showInactivityModal, INACTIVITY_TIMEOUT);
}

function showInactivityWarning() {
    var chip = document.querySelector('.user-chip');
    if (!chip) return;
    var warn = document.getElementById('inactivityWarningBadge');
    if (!warn) {
        warn = document.createElement('span');
        warn.id = 'inactivityWarningBadge';
        warn.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,0.25);color:#fbbf24;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;animation:toastFadeIn 0.3s ease';
        warn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg> Sesion por expirar';
        chip.parentNode.insertBefore(warn, chip.nextSibling);
    }
}

function hideInactivityWarning() {
    var warn = document.getElementById('inactivityWarningBadge');
    if (warn) warn.remove();
}

function showInactivityModal() {
    hideInactivityWarning();
    var modal = document.getElementById('inactivityModal');
    if (modal) modal.classList.add('open');
    var userChip = document.querySelector('.user-chip');
    if (userChip) {
        var username = userChip.getAttribute('data-username');
        var input = document.getElementById('inactivityUser');
        if (input && username) input.value = username;
    }
    var pass = document.getElementById('inactivityPass');
    if (pass) pass.focus();
}

function hideInactivityModal() {
    var modal = document.getElementById('inactivityModal');
    if (modal) modal.classList.remove('open');
    resetInactivityTimer();
}

async function verifyInactivityCredentials() {
    var username = document.getElementById('inactivityUser').value.trim();
    var password = document.getElementById('inactivityPass').value;
    var error = document.getElementById('inactivityError');

    if (!username || !password) {
        error.textContent = 'Ingrese usuario y contrasena';
        error.style.display = 'block';
        return;
    }

    var btn = document.getElementById('inactivityVerifyBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

    try {
        var res = await apiFetch('/login', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ username: username, password: password })
        });

        var json = null;
        try { json = await res.json(); } catch (e) { json = null; }

        if (res.status === 429) {
            error.textContent = 'Demasiados intentos fallidos. Espere un minuto e intente de nuevo.';
            error.style.display = 'block';
            return;
        }

        if (json && json.success) {
            if (json.csrf_token) {
                CSRF_TOKEN = json.csrf_token;
                var meta = document.querySelector('meta[name="csrf-token"]');
                if (meta) meta.content = json.csrf_token;
            }
            if (json.password_expired) {
                window.location.reload();
                return;
            }
            hideInactivityModal();
            document.getElementById('inactivityUser').value = '';
            document.getElementById('inactivityPass').value = '';
            error.style.display = 'none';
            if (typeof showToast === 'function') showToast('Sesion verificada correctamente', 'success');
        } else {
            error.textContent = (json && json.message) ? json.message : 'Credenciales incorrectas';
            error.style.display = 'block';
        }
    } catch (e) {
        error.textContent = connError('/login', e);
        error.style.display = 'block';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Verificar'; }
    }
}

async function inactivityKeepAlive() {
    var modal = document.getElementById('inactivityModal');
    if (modal && modal.classList.contains('open')) return;
    try {
        await fetch('/auth/keep-alive', {
            method: 'POST',
            headers: csrfHeader(),
            body: '{}'
        });
    } catch (e) { /* silencioso: la sesion se renueva con el proximo request */ }
}

function startInactivityControl() {
    resetInactivityTimer();
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(inactivityKeepAlive, KEEPALIVE_INTERVAL);
}

document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keydown', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInactivityControl);
} else {
    startInactivityControl();
}
