// ============================================================
// admin.js - Logica del panel administrativo
// Secciones: Auditoria, Gestion de Usuarios
// Compatible con PHP 7.4 / PostgreSQL
// ============================================================

// ============================================================
// AUDITORIA
// ============================================================
window._auditData = [];
window._auditPage = 1;
window._auditPerPage = 10;

// Peticion segura: si la sesion expiro y el servidor redirige al login
// (HTML en vez de JSON) o responde 401/419, se devuelve al login.
async function adminGet(url) {
    var res = await fetch(url, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
    if (res.redirected || res.status === 401 || res.status === 419) {
        window.location.href = '/';
        throw new Error('Sesion expirada');
    }
    if (!res.ok) {
        throw new Error('Error HTTP ' + res.status);
    }
    var ct = res.headers.get('content-type') || '';
    if (ct.indexOf('json') === -1) {
        window.location.href = '/';
        throw new Error('Sesion expirada');
    }
    return res.json();
}

function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
}

async function loadAuditoria() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando auditoria...</div>';

    try {
        const json = await adminGet('/api/auditoria');
        window._auditAllData = json.data || [];
        window._auditData = window._auditAllData;
        window._auditPage = 1;

        renderAuditLayout();
        loadAuditStats();
    } catch(e) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar la auditoria: ' + e.message + '</div>';
    }
}

function renderAuditLayout() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    const data = window._auditData || [];

    let html = `
    <div class="admin-section-header">
        <div class="admin-section-title">
            <h2>Registro de Auditoria</h2>
            <p>Control de accesos, ediciones y operaciones del sistema</p>
        </div>
        <div class="d-flex gap-2">
            <a href="javascript:void(0)" onclick="exportAudit('pdf')" class="btn btn-secondary btn-sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg> Exportar PDF</a>
            <a href="javascript:void(0)" onclick="exportAudit('pdf_print')" class="btn btn-secondary btn-sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg> Imprimir</a>
            <a href="javascript:void(0)" onclick="exportAudit('excel')" class="btn btn-secondary btn-sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 13l2.5 3.5L8 20h2l1.5-2.2L13 20h2l-2.5-3.5L15 13h-2l-1.5 2.2L10 13H8z"/></svg> Exportar Excel</a>
        </div>
    </div>

    <div class="audit-filters">
        <label>Filtrar por accion:</label>
        <select id="filterAccion" onchange="filterAudit()">
            <option value="">Todas</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="editar">Editar</option>
            <option value="agregar">Agregar</option>
            <option value="exportar">Exportar</option>
        </select>
        <label>Usuario:</label>
        <input type="text" id="filterUsuario" placeholder="Nombre de usuario..." oninput="filterAudit()">
        <label>Fecha:</label>
        <input type="date" id="filterFecha" onchange="filterAudit()">
    </div>

    <div class="grid-4" style="margin-bottom:24px" id="auditStats">
        <div class="loading"><div class="spinner"></div></div>
    </div>

    <div class="table-container" id="auditTable">
    <div class="table-wrapper">
    <table id="auditDataTable">
        <thead>
            <tr>
                <th>#</th><th>Usuario</th><th>Accion</th><th>Descripcion</th>
                <th>Trabajador</th><th>IP</th><th>Fecha y Hora</th>
            </tr>
        </thead>
        <tbody></tbody></table></div></div>
    <div id="auditPagination" style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px"></div>`;

    container.innerHTML = html;
    renderAuditPage();
}

function renderAuditPage() {
    const tbody = document.querySelector('#auditDataTable tbody');
    if (!tbody) return;
    const data = window._auditData || [];
    const page = window._auditPage || 1;
    const perPage = window._auditPerPage || 10;

    const start = (page - 1) * perPage;
    const pageData = data.slice(start, start + perPage);

    tbody.innerHTML = pageData.map((row, i) => {
        const accionClass = 'action-' + row.accion;
        return '<tr data-accion="' + (row.accion || '') + '" data-usuario="' + ((row.usuario || '').toLowerCase()) + '" data-fecha="' + (row.fecha_hora ? (row.fecha_hora.includes('T') ? row.fecha_hora.split('T')[0] : row.fecha_hora.split(' ')[0]) : '') + '">' +
            '<td style="color:var(--gray-500);font-size:12px">' + (start + i + 1) + '</td>' +
            '<td><strong>' + (row.usuario || '') + '</strong></td>' +
            '<td><span class="' + accionClass + '">' + (row.accion || '') + '</span></td>' +
            '<td style="max-width:300px;font-size:12px">' + (row.descripcion || '—') + '</td>' +
            '<td><small>' + (row.trabajador_nombre || '—') + '</small></td>' +
            '<td><code style="font-size:11px">' + (row.ip_address || '—') + '</code></td>' +
            '<td style="white-space:nowrap;font-size:12px">' + (row.fecha_hora ? new Date(row.fecha_hora).toLocaleString('es-ES') : '—') + '</td>' +
        '</tr>';
    }).join('');

    renderAuditPagination(data.length);
}

function renderAuditPagination(total) {
    const el = document.getElementById('auditPagination');
    if (!el) return;
    const page = window._auditPage || 1;
    const perPage = window._auditPerPage || 10;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (totalPages <= 1) {
        el.innerHTML = '<small style="color:var(--gray)">' + total + ' registro(s)</small>';
        return;
    }

    let html = '<button class="btn btn-sm btn-secondary" onclick="goAuditPage(1)" ' + (page <= 1 ? 'disabled' : '') + '>&laquo;</button>';
    html += '<button class="btn btn-sm btn-secondary" onclick="goAuditPage(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>&lsaquo;</button>';

    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    if (endPage - startPage < 4) {
        if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
        else startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += '<button class="btn btn-sm ' + (i === page ? 'btn-primary' : 'btn-secondary') + '" onclick="goAuditPage(' + i + ')">' + i + '</button>';
    }

    html += '<button class="btn btn-sm btn-secondary" onclick="goAuditPage(' + (page + 1) + ')" ' + (page >= totalPages ? 'disabled' : '') + '>&rsaquo;</button>';
    html += '<button class="btn btn-sm btn-secondary" onclick="goAuditPage(' + totalPages + ')" ' + (page >= totalPages ? 'disabled' : '') + '>&raquo;</button>';
    html += '<small style="color:var(--gray);margin-left:8px">' + total + ' registro(s) &middot; Pag. ' + page + ' de ' + totalPages + '</small>';

    el.innerHTML = html;
}

function goAuditPage(p) {
    const total = (window._auditData || []).length;
    const totalPages = Math.max(1, Math.ceil(total / (window._auditPerPage || 10)));
    if (p < 1 || p > totalPages) return;
    window._auditPage = p;
    renderAuditPage();
}

async function loadAuditStats() {
    const el = document.getElementById('auditStats');
    if (!el) return;
    try {
        const stats = await adminGet('/api/auditoria/stats');
        el.innerHTML = `
        <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Eventos</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--success)">${stats.logins}</div><div class="stat-label">Inicios de Sesion</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${stats.ediciones}</div><div class="stat-label">Ediciones</div></div>`;
    } catch(e) {
        el.innerHTML = '<div class="alert alert-error">Error al cargar estadisticas</div>';
    }
}

function filterAudit() {
    const accion = val('filterAccion');
    const usuario = val('filterUsuario').toLowerCase();
    const fecha = val('filterFecha');

    const allData = window._auditAllData || window._auditData || [];

    if (!accion && !usuario && !fecha) {
        window._auditData = allData;
    } else {
        window._auditData = allData.filter(function(row) {
            const matchAccion = !accion || row.accion === accion;
            const matchUser = !usuario || (row.usuario || '').toLowerCase().includes(usuario);
            const rowFecha = row.fecha_hora ? (row.fecha_hora.includes('T') ? row.fecha_hora.split('T')[0] : row.fecha_hora.split(' ')[0]) : '';
            const matchFecha = !fecha || rowFecha === fecha;
            return matchAccion && matchUser && matchFecha;
        });
    }

    window._auditPage = 1;
    renderAuditPage();
    renderAuditFilteredStats();
}

function renderAuditFilteredStats() {
    const el = document.getElementById('auditStats');
    if (!el) return;
    const data = window._auditData || [];
    const allData = window._auditAllData || [];
    const total = data.length;
    const logins = data.filter(function(r) { return r.accion === 'login'; }).length;
    const ediciones = data.filter(function(r) { return r.accion === 'editar' || r.accion === 'edit'; }).length;
    var usuarios = {};
    data.forEach(function(r) { if (r.usuario) usuarios[r.usuario] = true; });
    var usuariosCount = Object.keys(usuarios).length;
    var isFiltered = data.length !== allData.length;
    el.innerHTML = `
    <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total Eventos</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--success)">${logins}</div><div class="stat-label">Inicios de Sesion</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${ediciones}</div><div class="stat-label">Ediciones</div></div>`;
}

function exportAudit(format) {
    const accion = val('filterAccion');
    const usuario = val('filterUsuario');
    const fecha = val('filterFecha');
    var isPdf = format === 'pdf' || format === 'pdf_print';
    var ext = (isPdf ? 'pdf' : format);
    var url = '/api/export/' + ext + '/auditoria';
    if (accion) url += '?accion=' + encodeURIComponent(accion);
    if (usuario) url += (url.includes('?') ? '&' : '?') + 'usuario=' + encodeURIComponent(usuario);
    if (fecha) url += (url.includes('?') ? '&' : '?') + 'fecha=' + encodeURIComponent(fecha);
    window.open(url, '_blank');
}

// ============================================================
// GESTION DE USUARIOS
// ============================================================
var _allUsuarios = [];

async function loadUsuarios() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando usuarios...</div>';

    try {
        const json = await adminGet('/api/usuarios');
        _allUsuarios = json.data || [];
        renderUsuarios();
    } catch(e) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar los usuarios: ' + e.message + '</div>';
    }
}

function renderUsuarios() {
    const container = document.getElementById('adminContent');
    if (!container) return;

    const filterRol = val('filterUsuarioRol');

    var data = _allUsuarios;
    if (filterRol) data = data.filter(function(u) { return u.role === filterRol; });

    let html = `
    <div class="admin-section-header">
        <div class="admin-section-title">
            <h2>Gestion de Usuarios del Sistema</h2>
            <p>Agregue, edite o elimine usuarios especialistas y administradores</p>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm" onclick="openAddUsuario()">+ Nuevo Usuario</button>
        </div>
    </div>

    <div class="audit-filters">
        <label>Filtrar por rol:</label>
        <select id="filterUsuarioRol" onchange="renderUsuarios()">
            <option value="">Todos</option>
            <option value="especialista">Especialista</option>
            <option value="admin">Administrador</option>
        </select>
        <span class="badge badge-blue">${data.length} usuario(s)</span>
    </div>

    <div class="table-container">
    <div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>ID</th><th>Usuario</th><th>Nombre Completo</th><th>Rol</th>
                <th>Activo</th><th>Ult. Acceso</th><th>Creado</th><th>Acciones</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach(function(u) {
        const rolLabel = u.role === 'admin' ? 'Administrador' : (u.role === 'especialista' ? 'Especialista' : u.role);
        html += `
        <tr>
            <td>${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.full_name || '—'}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : 'badge-blue'}">${rolLabel}</span></td>
            <td>${u.activo === true || u.activo === 't' ? '<span class="badge badge-success">Si</span>' : '<span class="badge badge-gray">No</span>'}</td>
            <td><small>${u.ultimo_acceso || '—'}</small></td>
            <td><small>${u.created_at || '—'}</small></td>
            <td style="white-space:nowrap">
                <button class="btn btn-secondary btn-sm" onclick="openEditUsuario(${u.id})" aria-label="Editar usuario ${u.username}"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
                <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id}, '${u.username}')" aria-label="Eliminar usuario ${u.username}"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div></div>';
    container.innerHTML = html;
}

function openAddUsuario() {
    document.getElementById('usuarioModalTitle').textContent = '+ Nuevo Usuario';
    document.getElementById('usuarioEditId').value = '';
    document.getElementById('usuarioUsername').value = '';
    document.getElementById('usuarioUsername').disabled = false;
    document.getElementById('usuarioFullName').value = '';
    var pwField = document.getElementById('usuarioPassword');
    var pwGroup = pwField.closest('.form-group');
    if (pwGroup) pwGroup.style.display = '';
    pwField.value = '';
    pwField.required = true;
    pwField.disabled = false;
    pwField.placeholder = 'min. 6 caracteres';
    var pwHelp = pwField.nextElementSibling;
    if (pwHelp) pwHelp.textContent = 'La contrasena debe tener al menos 6 caracteres';
    document.getElementById('usuarioError').style.display = 'none';
    document.getElementById('usuarioModal').classList.add('open');
}

async function openEditUsuario(id) {
    document.getElementById('usuarioModalTitle').textContent = 'Editar Usuario';
    document.getElementById('usuarioEditId').value = id;
    document.getElementById('usuarioError').style.display = 'none';
    document.getElementById('usuarioPassword').required = false;
    document.getElementById('usuarioPassword').placeholder = 'Dejar en blanco para mantener';

    // Obtener datos del usuario
    try {
        const json = await adminGet('/api/usuarios');
        const user = (json.data || []).find(function(u) { return u.id == id; });
        if (user) {
            document.getElementById('usuarioUsername').value = user.username;
            document.getElementById('usuarioUsername').disabled = true;
            document.getElementById('usuarioFullName').value = user.full_name || '';

            // Obtener usuario actual desde el panel (atributo data-username)
            var chip = document.querySelector('.user-chip');
            var currentUser = chip ? (chip.getAttribute('data-username') || '') : '';
            var isOwnAccount = (user.username === currentUser);

            document.getElementById('usuarioPassword').value = '';
            var pwField = document.getElementById('usuarioPassword');
            var pwGroup = pwField.closest('.form-group');
            var pwHelp = pwField.nextElementSibling;

            if (pwGroup) pwGroup.style.display = '';
            pwField.disabled = false;
            pwField.placeholder = 'Nueva contrasena (dejar en blanco para mantener)';
            if (isOwnAccount) {
                if (pwHelp) pwHelp.textContent = 'Solo puede cambiar su contrasena una vez por semana';
            } else {
                if (pwHelp) pwHelp.textContent = 'Como administrador puede restablecer la contrasena de este usuario';
            }

            document.getElementById('usuarioModal').classList.add('open');
        }
    } catch(e) {
        showToast('Error al cargar datos del usuario', 'error');
    }
}

async function guardarUsuario() {
    const editId = document.getElementById('usuarioEditId').value;
    const username = document.getElementById('usuarioUsername').value.trim();
    const fullName = document.getElementById('usuarioFullName').value.trim();
    const role = 'especialista';
    const password = document.getElementById('usuarioPassword').value;
    const errorDiv = document.getElementById('usuarioError');

    errorDiv.style.display = 'none';

    if (!username || username.length < 3) {
        errorDiv.textContent = 'El usuario debe tener al menos 3 caracteres';
        errorDiv.style.display = 'block';
        return;
    }

    if (password && password.length < 6) {
        errorDiv.textContent = 'La contrasena debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }

    if (!editId && !password) {
        errorDiv.textContent = 'Debe indicar una contrasena para el nuevo usuario';
        errorDiv.style.display = 'block';
        return;
    }

    if (password === '123456') {
        errorDiv.textContent = 'La contrasena no puede ser 123456';
        errorDiv.style.display = 'block';
        return;
    }

    var saveBtn = document.querySelector('#usuarioModal .modal-footer .btn-primary');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

    try {
        var csrf = document.querySelector('meta[name="csrf-token"]');
        var token = csrf ? csrf.content : '';
        var headers = { 'X-CSRF-TOKEN': token, 'Content-Type': 'application/json' };
        var body;
        if (editId) {
            body = { role: role, full_name: fullName };
            if (password) body.password = password;
        } else {
            body = { username: username, password: password, role: role, full_name: fullName };
        }

        var method = editId ? 'PUT' : 'POST';
        var url = editId ? '/api/usuarios/' + editId : '/api/usuarios';
        const res = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(body)
        });
        const json = await res.json();

        if (json.success) {
            closeModal('usuarioModal');
            showToast('Usuario guardado correctamente', 'success');
            loadUsuarios();
        } else {
            errorDiv.textContent = json.error || 'Error al guardar';
            errorDiv.style.display = 'block';
        }
    } catch(e) {
        errorDiv.textContent = connError(url, e);
        errorDiv.style.display = 'block';
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar'; }
    }
}

async function eliminarUsuario(id, username) {
    confirmAction('¿Esta seguro de eliminar al usuario "' + username + '"?', async function() {
        try {
            var csrf = document.querySelector('meta[name="csrf-token"]');
            var token = csrf ? csrf.content : '';
            const res = await fetch('/api/usuarios/' + id, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': token }
            });
            const json = await res.json();
            if (json.success) {
                showToast('Usuario eliminado', 'success');
                loadUsuarios();
            } else {
                showToast(json.error || 'Error al eliminar', 'error');
            }
        } catch(e) {
            showToast(connError('/api/usuarios/' + id, e), 'error');
        }
    });
}

// ============================================================
// HELPERS
// ============================================================
function closeModal(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.remove('open'); el.classList.remove('active'); }
}

function showToast(msg, type) {
    var toast = document.createElement('div');
    toast.className = 'alert alert-' + (type || 'success');
    toast.style.cssText = 'position:fixed;bottom:80px;right:20px;z-index:9999;min-width:260px;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:toastFadeIn 0.3s ease;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.animation = 'toastFadeOut 0.3s ease forwards';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3200);
}

function confirmAction(message, callback) {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'confirmActionModal';
    modal.innerHTML = '<div class="modal" style="max-width:440px">' +
        '<div class="modal-header"><span class="modal-title">Confirmar Accion</span><button class="btn-close" onclick="closeModal(\'confirmActionModal\')">&times;</button></div>' +
        '<div class="modal-body"><p style="margin-bottom:16px">' + message + '</p>' +
        '<div class="alert alert-warning" style="margin:0">Esta accion no se puede deshacer.</div></div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-secondary" onclick="closeModal(\'confirmActionModal\')">Cancelar</button>' +
        '<button class="btn btn-danger" id="confirmActionBtn">Confirmar</button></div></div>';
    document.body.appendChild(modal);
    document.getElementById('confirmActionBtn').onclick = function() {
        closeModal('confirmActionModal');
        callback();
    };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal('confirmActionModal');
    });
}
