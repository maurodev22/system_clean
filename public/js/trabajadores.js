// ============================================================
// trabajadores.js - Gestion completa de trabajadores
// Funcionalidades: navegacion, CRUD, paginacion, busqueda,
//                  control de inactividad, concurrencia,
//                  validacion de formularios, confirmacion de salida
// Compatible con PHP 7.4 / PostgreSQL
// ============================================================

const API_BASE = '/api/trabajadores';
const API_BLOQUEOS = '/api/bloqueos';
const API_DONANTES = '/api/donantes';
const API_DIVISIONES = '/api/divisiones';
const API_ENFERMEDADES = '/api/enfermedades';
const API_EXPORT = '/api/export';
const API_LOGIN = '/login';
var CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').content : '';

function csrfHeader() {
    return { 'X-CSRF-TOKEN': CSRF_TOKEN, 'Content-Type': 'application/json' };
}
let allTrabajadores = [];
let divisiones = [];
let enfermedades = [];
let unidadesOrganizativas = [];
let currentDivisionFilter = null;
let currentUOFilter = null;
let currentAltoRiesgoFilter = null;
let currentPage = 1;
let currentPerPage = 20;
let currentSortField = 'nombre';
let currentSortDir = 'ASC';
let selectedTrabajadoresIds = {};

// ============================================================
// CONFIRMACION DE SALIDA - beforeunload solo con cambios sin guardar
// ============================================================
let hasUnsavedChanges = false;

window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============================================================
// NAVEGACION
// ============================================================
var sectionTitles = {
    inicio: 'Inicio',
    trabajadores: 'Trabajadores',
    importar: 'Importar Excel',
    graficos: 'Graficos',
    donantes: 'Donantes de Sangre',
    maternidad: 'Maternidad'
};

function setNav(section, el) {
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.querySelectorAll('.nav-dropdown').forEach(function(d) { d.classList.remove('open'); });
    if (el) el.classList.add('active');
    document.querySelectorAll('[id^="section-"]').forEach(function(s) { s.classList.add('hidden'); });
    var sec = document.getElementById('section-' + section);
    if (sec) sec.classList.remove('hidden');

    var aside = document.querySelector('.app-aside');
    if (aside) {
        if (section === 'inicio' || section === 'graficos' || section === 'donantes' || section === 'importar' || section === 'maternidad') {
            aside.style.display = 'none';
        } else {
            aside.style.display = '';
        }
    }

    if (sectionTitles[section]) {
        document.title = 'Sistema de Gestion de Salud — ' + sectionTitles[section];
    }

    if (section === 'trabajadores') {
        currentDivisionFilter = null;
        currentUOFilter = null;
        currentPage = 1;
        loadTrabajadores(null);
    }
    if (section === 'graficos')  { try { loadGraficos && loadGraficos(); } catch(e) { console.error(e); } }
    if (section === 'donantes')  { try { loadDonantes && loadDonantes(); } catch(e) { console.error(e); } }
    if (section === 'importar')  { try { showImportSection && showImportSection(); } catch(e) { console.error(e); } }
    if (section === 'maternidad') { try { loadMaternidad && loadMaternidad(); } catch(e) { console.error(e); } }
    if (section === 'inicio')    { try { loadQuickStats(); } catch(e) { console.error(e); } }
}

function setNavAltoRiesgo(tipo) {
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.querySelectorAll('.nav-dropdown').forEach(function(d) { d.classList.remove('open'); });
    document.querySelectorAll('[id^="section-"]').forEach(function(s) { s.classList.add('hidden'); });
    var sec = document.getElementById('section-altoriesgo');
    if (sec) sec.classList.remove('hidden');
    var aside = document.querySelector('.app-aside');
    if (aside) aside.style.display = 'none';
    currentAltoRiesgoFilter = tipo;
    var labels = {liniero:'Linieros', torrero:'Torreros', operario_cables:'Operarios de Cables', chofer:'Choferes', operador_grua:'Operadores de Grua'};
    document.title = 'Sistema de Gestion de Salud — Alto Riesgo: ' + (labels[tipo] || tipo);
    loadAltoRiesgo(tipo);
}

function toggleDropdown(e) {
    e.stopPropagation();
    var dd = e.currentTarget.closest('.nav-dropdown');
    if (!dd) return;
    var isOpen = dd.classList.contains('open');
    document.querySelectorAll('.nav-dropdown').forEach(function(d) { d.classList.remove('open'); });
    if (!isOpen) dd.classList.add('open');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown').forEach(function(d) { d.classList.remove('open'); });
    }
});

function filterByDivision(id, el) {
    document.querySelectorAll('.aside-sub-item').forEach(function(i) { i.classList.remove('active'); });
    if (el) el.classList.add('active');
    currentDivisionFilter = id;
    currentPage = 1;

    document.querySelectorAll('[id^="section-"]').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('section-trabajadores').classList.remove('hidden');
    loadTrabajadores(id);
}

function toggleAside(el) {
    var sub = el.nextElementSibling;
    if (sub) sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
}

var uoPage = 1;
var uoPerPage = 8;
var uoFiltered = [];

async function loadUOs() {
    try {
        var res = await fetch(API_BASE + '/unidades-organizativas');
        var data = await res.json();
        unidadesOrganizativas = data || [];
        uoFiltered = unidadesOrganizativas.slice();
        renderUOs();
    } catch(e) {
        var list = document.getElementById('asideUOsList');
        if (list) list.innerHTML = '<div style="padding:12px 14px;font-size:12px;color:var(--gray)">' + connError(API_BASE + '/unidades-organizativas', e) + '</div>';
    }
}

function filterUOs() {
    var q = document.getElementById('uoSearchInput').value.toLowerCase().trim();
    if (!q) {
        uoFiltered = unidadesOrganizativas.slice();
    } else {
        uoFiltered = unidadesOrganizativas.filter(function(u) {
            return u.unidad_organizativa.toLowerCase().indexOf(q) !== -1;
        });
    }
    uoPage = 1;
    renderUOs();
}

function renderUOs() {
    var container = document.getElementById('asideUOsList');
    if (!container) return;
    if (!uoFiltered.length) {
        container.innerHTML = '<div style="padding:12px 14px;font-size:12px;color:var(--gray)">Sin unidades registradas</div>';
        return;
    }
    var start = (uoPage - 1) * uoPerPage;
    var end = Math.min(start + uoPerPage, uoFiltered.length);
    var pageData = uoFiltered.slice(start, end);

    var html = '';
    pageData.forEach(function(u) {
        html += '<div class="aside-sub-item" onclick="filterByUO(\'' + u.unidad_organizativa.replace(/'/g, "\\'") + '\', this)">' +
            u.unidad_organizativa + ' <span style="font-size:10px;color:var(--gray)">(' + u.total + ')</span></div>';
    });

    var totalPages = Math.ceil(uoFiltered.length / uoPerPage);
    if (totalPages > 1) {
        html += '<div style="padding:8px 14px;display:flex;gap:3px;flex-wrap:wrap;align-items:center">' +
            '<button class="btn btn-sm btn-secondary" onclick="uoGoToPage(1)" style="padding:2px 6px;font-size:11px"' + (uoPage <= 1 ? ' disabled' : '') + '>«</button>' +
            '<button class="btn btn-sm btn-secondary" onclick="uoGoToPage(' + (uoPage - 1) + ')" style="padding:2px 6px;font-size:11px"' + (uoPage <= 1 ? ' disabled' : '') + '>‹</button>' +
            '<span style="font-size:11px;padding:2px 4px;color:var(--gray)">' + uoPage + '/' + totalPages + '</span>' +
            '<button class="btn btn-sm btn-secondary" onclick="uoGoToPage(' + (uoPage + 1) + ')" style="padding:2px 6px;font-size:11px"' + (uoPage >= totalPages ? ' disabled' : '') + '>›</button>' +
            '<button class="btn btn-sm btn-secondary" onclick="uoGoToPage(' + totalPages + ')" style="padding:2px 6px;font-size:11px"' + (uoPage >= totalPages ? ' disabled' : '') + '>»</button>' +
            '</div>';
    }

    html += '<div style="padding:8px 14px">' +
        '<button class="btn btn-secondary btn-sm" style="width:100%;font-size:11px" onclick="filterByUO(null,null)">Ver Todos</button>' +
        '</div>';

    container.innerHTML = html;
}

function uoGoToPage(p) {
    if (p < 1) p = 1;
    var totalPages = Math.ceil(uoFiltered.length / uoPerPage);
    if (p > totalPages) p = totalPages;
    uoPage = p;
    renderUOs();
}

function filterByUO(uo, el) {
    document.querySelectorAll('.aside-sub-item').forEach(function(i) { i.classList.remove('active'); });
    if (el) el.classList.add('active');
    currentUOFilter = uo;
    currentDivisionFilter = null;
    currentPage = 1;
    document.querySelectorAll('[id^="section-"]').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('section-trabajadores').classList.remove('hidden');
    loadTrabajadores(null);
}

// ============================================================
// STATS INICIO
// ============================================================
async function loadQuickStats() {
    var container = document.getElementById('quickStats');
    if (!container) return;
    try {
        var res = await fetch(API_BASE + '/stats/overview');
        var s = await res.json();
        container.innerHTML =
            statCard(s.total || 0, 'Total Trabajadores') +
            statCard(s.alto_riesgo || 0, 'Alto Riesgo') +
            statCard(s.chequeo_vencido || 0, 'Chequeo Vencido') +
            statCard(s.donantes || 0, 'Donantes de Sangre');
    } catch(e) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar estadisticas</div>';
    }
    await loadAlertasVencimiento();
}

async function loadAlertasVencimiento() {
    var alertContainer = document.getElementById('alertasVencimiento');
    if (!alertContainer) return;
    try {
        var res = await fetch(API_BASE + '/stats/vencidos');
        var json = await res.json();
        var data = json.data || [];
        if (data.length === 0) {
            alertContainer.innerHTML = '<div class="alert alert-success"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Todos los trabajadores tienen su chequeo medico al dia.</div>';
            return;
        }
        var html = '<div class="alert alert-warning" style="cursor:pointer" onclick="toggleAlertasLista()">' +
            '<strong><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg> ' + data.length + ' trabajador(es) con chequeo medico vencido</strong>' +
            ' <span id="alertasToggleIcon" style="font-size:11px">&#9660;</span></div>' +
            '<div id="alertasLista" style="display:none">' +
            '<div class="table-wrapper"><table><thead><tr>' +
            '<th>No. Personal</th><th>Nombre</th><th>Cargo</th><th>Division</th>' +
            '<th>Ultimo Chequeo</th><th>Dias Vencido</th></tr></thead><tbody>';
        var today = new Date();
        data.forEach(function(t) {
            var chequeoDate = t.fecha_ultimo_chequeo ? new Date(t.fecha_ultimo_chequeo) : null;
            var diasVencido = chequeoDate ? Math.floor((today - chequeoDate) / (1000*60*60*24)) - 365 : 'Sin chequeo';
            var chequeoStr = chequeoDate ? chequeoDate.toLocaleDateString('es-ES') : '&#8212;';
            html += '<tr>' +
                '<td><span class="badge badge-blue" style="font-family:monospace">' + t.id_numerico + '</span></td>' +
                '<td><strong>' + t.nombre + '</strong></td>' +
                '<td>' + t.cargo + '</td>' +
            '<td><small>' + (t.unidad_organizativa || '&#8212;') + '</small></td>' +
                '<td class="chequeo-vencido">' + chequeoStr + '</td>' +
                '<td class="chequeo-vencido"><strong>' + diasVencido + '</strong></td></tr>';
        });
        html += '</tbody></table></div></div>';
        alertContainer.innerHTML = html;
    } catch(e) {
        console.error('[loadAlertasVencimiento] error:', e);
    }
}

function toggleAlertasLista() {
    var lista = document.getElementById('alertasLista');
    var icon = document.getElementById('alertasToggleIcon');
    if (!lista) return;
    var isVisible = lista.style.display !== 'none';
    lista.style.display = isVisible ? 'none' : 'block';
    if (icon) icon.innerHTML = isVisible ? '&#9660;' : '&#9650;';
}

function statCard(val, label) {
    return '<div class="stat-card"><div class="stat-value">' + val + '</div><div class="stat-label">' + label + '</div></div>';
}

// ============================================================
// CARGA TRABAJADORES CON PAGINACION
// ============================================================
async function loadTrabajadores(divisionId) {
    var container = document.getElementById('trabajadoresContent');
    if (!container) return;
    showLoading(container);
    currentDivisionFilter = divisionId || null;
    try {
        var url = API_BASE + '?page=' + currentPage + '&per_page=' + currentPerPage;
        if (divisionId) url += '&division=' + divisionId;
        if (currentUOFilter) url += '&uo=' + encodeURIComponent(currentUOFilter);
        var res = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } }, 20000);
        var json = await res.json();
        allTrabajadores = json.data || [];
        renderTrabajadoresTable(allTrabajadores, json.total, json.page, json.total_pages);
    } catch(e) {
        container.innerHTML = '<div class="alert alert-error">' + connError(url, e) + '</div>';
    }
}

function renderTrabajadoresTable(data, total, page, totalPages) {
    var container = document.getElementById('trabajadoresContent');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No hay trabajadores registrados.</div>';
        return;
    }

    var today = new Date();
    var oneYearAgo = new Date(today.getFullYear()-1, today.getMonth(), today.getDate());

    var html = '<div class="table-toolbar">' +
        '<div class="d-flex gap-2 align-center">' +
        (currentUOFilter ? '<span class="badge badge-warning" style="font-size:12px;padding:4px 12px"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg> ' + currentUOFilter + '</span>' : '') +
        '<span class="badge badge-blue">' + (total || data.length) + ' trabajadores</span>' +
        '<span class="badge badge-blue" id="selectedCountBadge" style="display:none"><span id="selectedCount">0</span> seleccionado(s)</span></div>' +
        '<div class="d-flex gap-2">' +
            '<button class="btn btn-secondary btn-sm" onclick="exportSelected(\'pdf\')"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg> PDF Sel.</button>' +
            '<button class="btn btn-secondary btn-sm" onclick="exportSelected(\'excel\')"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 13l2.5 3.5L8 20h2l1.5-2.2L13 20h2l-2.5-3.5L15 13h-2l-1.5 2.2L10 13H8z"/></svg> Excel Sel.</button>' +
            '<a href="/api/export/pdf/trabajadores" target="_blank" class="btn btn-secondary btn-sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg> PDF</a>' +
            '<a href="/api/export/excel/trabajadores" target="_blank" class="btn btn-secondary btn-sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 13l2.5 3.5L8 20h2l1.5-2.2L13 20h2l-2.5-3.5L15 13h-2l-1.5 2.2L10 13H8z"/></svg> Excel</a>' +
        '</div></div>' +
        '<div class="table-wrapper"><table id="trabajadoresTable"><thead><tr>' +
        '<th style="width:36px;text-align:center"><input type="checkbox" id="selectAllTrabajadores" onclick="toggleSelectAllTrabajadores(this)" aria-label="Seleccionar todos"></th>' +
        '<th>No. Personal</th><th>Nombre Completo</th><th>F. Nacimiento</th><th>Unidad Organizativa</th>' +
        '<th>Sexo</th><th>Tipo Sangre</th><th>Alto Riesgo</th><th>Ult. Chequeo</th>' +
        '<th>Enfermedades</th><th>Acciones</th></tr></thead><tbody>';

    data.forEach(function(t) {
        var chequeo = t.fecha_ultimo_chequeo ? new Date(t.fecha_ultimo_chequeo) : null;
        var chequeoOk = chequeo && chequeo >= oneYearAgo;
        var chequeoStr = chequeo ? chequeo.toLocaleDateString('es-ES') : '&#8212;';
        var chequeoClass = chequeo ? (chequeoOk ? 'chequeo-ok' : 'chequeo-vencido') : '';
        var sexoStr = t.sexo == 1 ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:2px"><path d="M12 2C8.13 2 5 5.13 5 9c0 3.34 2.03 6.18 5 7.38V18H8v2h2v4h2v-4h2v-2h-2v-1.62c2.97-1.2 5-4.04 5-7.38 0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"/></svg> Femenino' : '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:2px"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V18H6v2h2v4h2v-4h2v-2h-2v-3.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"/></svg> Masculino';
        var altoRiesgo = t.es_alto_riesgo === true || t.es_alto_riesgo === 't';
        var arBadge = altoRiesgo
            ? '<span class="badge badge-danger"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align:middle;margin-right:2px"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6z"/></svg> ' + (t.tipo_alto_riesgo || 'AR') + (t.subcategoria_operario ? ' '+t.subcategoria_operario : '') + (t.subcategoria_chofer ? ' '+t.subcategoria_chofer : '') + '</span>'
            : '<span class="badge badge-gray">No</span>';
        var maternidad = (t.embarazada === true || t.embarazada === 't') ? ' <span class="badge badge-warning">Maternidad</span>' : '';
        var nombreCompleto = t.nombre;

        html += '<tr data-search="' + (t.nombre||'').toLowerCase() + ' ' + (t.id_numerico||'') + ' ' + (t.cargo||'').toLowerCase() + '">' +
            '<td style="text-align:center"><input type="checkbox" class="trabajador-check" value="' + t.id + '" onchange="onTrabajadorCheckChange(this)"' + (selectedTrabajadoresIds[t.id] ? ' checked' : '') + ' aria-label="Seleccionar ' + nombreCompleto + '"></td>' +
            '<td><span class="badge badge-blue" style="font-family:monospace">' + t.id_numerico + '</span></td>' +
            '<td><strong>' + nombreCompleto + '</strong>' + maternidad + '</td>' +
            '<td>' + (t.fecha_nacimiento ? new Date(t.fecha_nacimiento).toLocaleDateString('es-ES') : '&#8212;') + '</td>' +
            '<td><small>' + (t.unidad_organizativa || '&#8212;') + '</small></td>' +
            '<td>' + sexoStr + '</td>' +
            '<td><span class="badge ' + (t.tipo_sangre ? 'badge-danger' : 'badge-gray') + '" style="font-weight:700">' + (t.tipo_sangre || '&#8212;') + '</span></td>' +
            '<td>' + arBadge + '</td>' +
            '<td class="' + chequeoClass + '">' + chequeoStr + (!chequeoOk && chequeo ? ' <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align:middle"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>' : '') + '</td>' +
            '<td><small>' + (t.enfermedades_lista || '&#8212;') + '</small></td>' +
            '<td style="white-space:nowrap">' +
            '<button class="btn btn-secondary btn-sm" onclick="acquireAndEdit(' + t.id + ')" title="Editar" aria-label="Editar trabajador ' + nombreCompleto + '">Editar</button> ' +
            '<button class="btn btn-sm" style="background:var(--blue-light);color:var(--blue)" onclick="quickView(' + t.id + ')" title="Ver" aria-label="Ver detalle de ' + nombreCompleto + '"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>' +
            '</td></tr>';
    });

    html += '</tbody></table></div>';

    // Paginacion
    if (totalPages > 1) {
        html += '<div class="pagination">' +
            '<button class="btn btn-sm btn-secondary" onclick="goToPage(1)" ' + (page <= 1 ? 'disabled' : '') + '>&#171;</button>' +
            '<button class="btn btn-sm btn-secondary" onclick="goToPage(' + (page-1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>&#8249;</button>';

        var startPage = Math.max(1, page - 2);
        var endPage = Math.min(totalPages, page + 2);
        for (var p = startPage; p <= endPage; p++) {
            html += '<button class="btn btn-sm ' + (p === page ? 'btn-primary' : 'btn-secondary') + '" onclick="goToPage(' + p + ')">' + p + '</button>';
        }

        html += '<button class="btn btn-sm btn-secondary" onclick="goToPage(' + (page+1) + ')" ' + (page >= totalPages ? 'disabled' : '') + '>&#8250;</button>' +
            '<button class="btn btn-sm btn-secondary" onclick="goToPage(' + totalPages + ')" ' + (page >= totalPages ? 'disabled' : '') + '>&#187;</button>' +
            '<span style="margin-left:10px;font-size:12px;color:var(--gray)">Pagina ' + page + ' de ' + totalPages + '</span>' +
            '<select class="form-control" style="width:auto;display:inline-block;margin-left:10px" onchange="changePerPage(this.value)">' +
            '<option value="10" ' + (currentPerPage === 10 ? 'selected' : '') + '>10</option>' +
            '<option value="20" ' + (currentPerPage === 20 ? 'selected' : '') + '>20</option>' +
            '<option value="50" ' + (currentPerPage === 50 ? 'selected' : '') + '>50</option>' +
            '<option value="100" ' + (currentPerPage === 100 ? 'selected' : '') + '>100</option>' +
            '</select></div>';
    }

    container.innerHTML = html;
    updateSelectedCount();
}

function goToPage(p) {
    currentPage = p;
    loadTrabajadores(currentDivisionFilter);
}

function changePerPage(val) {
    currentPerPage = parseInt(val);
    currentPage = 1;
    loadTrabajadores(currentDivisionFilter);
}

// ============================================================
// ALTO RIESGO
// ============================================================
async function loadAltoRiesgo(tipo) {
    var container = document.getElementById('altoRiesgoContent');
    if (!container) return;
    showLoading(container);
    try {
        var res = await fetch(API_BASE + '?altoriesgo=' + tipo);
        var json = await res.json();
        var data = json.data || [];
        var labels = { liniero:'Linieros', torrero:'Torreros', operario_cables:'Operarios de Cables', chofer:'Choferes', operador_grua:'Operadores de Grua' };
        var html = '<div class="d-flex justify-between align-center" style="margin-bottom:16px">' +
            '<div class="section-title" style="margin:0"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle;margin-right:6px"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg> ' + (labels[tipo] || tipo) + ' (' + data.length + ')</div>' +
            '<div class="d-flex gap-2">' +
            '<a href="/api/export/pdf/trabajadores?altoriesgo=' + tipo + '" target="_blank" class="btn btn-secondary btn-sm">Exportar PDF</a>' +
            '<a href="/api/export/pdf/trabajadores?altoriesgo=' + tipo + '" target="_blank" class="btn btn-secondary btn-sm">Imprimir</a>' +
            '<a href="/api/export/excel/trabajadores?altoriesgo=' + tipo + '" target="_blank" class="btn btn-secondary btn-sm">Excel</a>' +
            '</div></div>';
        if (!data.length) {
            html += '<div class="alert alert-info">No hay trabajadores de este tipo.</div>';
        } else {
            if (tipo === 'chofer') {
                html += '<div class="table-wrapper"><table><thead><tr>' +
                    '<th>No.</th><th>Nombre</th><th>Tipo Sangre</th><th>Categoria</th><th>Unidad Organizativa</th>' +
                    '<th>Ult. Chequeo</th><th>Recalificacion (2a)</th><th>Psicofisiologico</th><th>Chequeo Especializado</th><th>Acciones</th></tr></thead><tbody>';
                var today = new Date();
                var twoYearsAgo = new Date(today.getFullYear()-2, today.getMonth(), today.getDate());
                var oneYearAgo = new Date(today.getFullYear()-1, today.getMonth(), today.getDate());
                data.forEach(function(t) {
                    var chequeo = t.fecha_ultimo_chequeo ? new Date(t.fecha_ultimo_chequeo) : null;
                    var recal = t.fecha_recalificacion ? new Date(t.fecha_recalificacion) : null;
                    var psico = t.fecha_examen_psicofisiologico ? new Date(t.fecha_examen_psicofisiologico) : null;
                    var cheqEsp = t.fecha_chequeo_especializado ? new Date(t.fecha_chequeo_especializado) : null;
                    var chequeoOk = chequeo && chequeo >= oneYearAgo;
                    var recalOk = recal && recal >= twoYearsAgo;
                    var psicoOk = psico && psico >= oneYearAgo;
                    var cheqEspOk = cheqEsp && cheqEsp >= oneYearAgo;
                    var fmtDate = function(d) { return d ? d.toLocaleDateString('es-ES') : '&#8212;'; };
                    var status = function(ok, d) {
                        return '<span class="' + (ok ? 'chequeo-ok' : 'chequeo-vencido') + '">' + fmtDate(d) + '</span>';
                    };
                    html += '<tr>' +
                        '<td><span class="badge badge-blue" style="font-family:monospace">' + t.id_numerico + '</span></td>' +
                        '<td><strong>' + t.nombre + '</strong></td>' +
                        '<td><span class="badge badge-red" style="font-weight:700">' + (t.tipo_sangre || '—') + '</span></td>' +
                        '<td><span class="badge badge-danger">' + (t.subcategoria_chofer || '—') + '</span></td>' +
            '<td><small>' + (t.unidad_organizativa || '&#8212;') + '</small></td>' +
                        '<td>' + status(chequeoOk, chequeo) + '</td>' +
                        '<td>' + status(recalOk, recal) + '</td>' +
                        '<td>' + status(psicoOk, psico) + '</td>' +
                        '<td>' + status(cheqEspOk, cheqEsp) + '</td>' +
                        '<td style="white-space:nowrap"><button class="btn btn-secondary btn-sm" onclick="acquireAndEdit(' + t.id + ')" aria-label="Editar ' + t.nombre + '">Editar</button> ' +
                        '<button class="btn btn-sm" style="background:var(--blue-light);color:var(--blue)" onclick="quickView(' + t.id + ')" title="Ver" aria-label="Ver detalle de ' + t.nombre + '"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button></td></tr>';
                });
            } else {
                html += '<div class="table-wrapper"><table><thead><tr>' +
                    '<th>No.</th><th>Nombre</th><th>Tipo Sangre</th><th>Unidad Organizativa</th>' +
                    '<th>Sexo</th><th>Ult. Chequeo</th><th>Enfermedades</th><th>Acciones</th></tr></thead><tbody>';
                var today = new Date();
                var oneYearAgo = new Date(today.getFullYear()-1, today.getMonth(), today.getDate());
                data.forEach(function(t) {
                    var chequeo = t.fecha_ultimo_chequeo ? new Date(t.fecha_ultimo_chequeo) : null;
                    var chequeoOk = chequeo && chequeo >= oneYearAgo;
                    html += '<tr>' +
                        '<td><span class="badge badge-blue" style="font-family:monospace">' + t.id_numerico + '</span></td>' +
                        '<td><strong>' + t.nombre + '</strong></td>' +
                        '<td><span class="badge badge-red" style="font-weight:700">' + (t.tipo_sangre || '—') + '</span></td>' +
                        '<td>' + (t.unidad_organizativa || '&#8212;') + '</td>' +
                        '<td>' + (t.sexo == 1 ? 'Femenino' : 'Masculino') + '</td>' +
                        '<td class="' + (chequeo ? (chequeoOk ? 'chequeo-ok':'chequeo-vencido') : '') + '">' +
                        (chequeo ? chequeo.toLocaleDateString('es-ES') : '&#8212;') + '</td>' +
                        '<td><small>' + (t.enfermedades_lista || '&#8212;') + '</small></td>' +
                        '<td style="white-space:nowrap"><button class="btn btn-secondary btn-sm" onclick="acquireAndEdit(' + t.id + ')" aria-label="Editar ' + t.nombre + '">Editar</button> ' +
                        '<button class="btn btn-sm" style="background:var(--blue-light);color:var(--blue)" onclick="quickView(' + t.id + ')" title="Ver" aria-label="Ver detalle de ' + t.nombre + '"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button></td></tr>';
                });
            }
            html += '</tbody></table></div>';
        }
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar datos.</div>';
    }
}

// ============================================================
// CONTROL DE CONCURRENCIA - Bloqueo de edicion
// ============================================================
async function acquireAndEdit(id) {
    var inactivityModal = document.getElementById('inactivityModal');
    if (inactivityModal && inactivityModal.classList.contains('open')) {
        showToast('Su sesion esta inactiva. Re-autentiquese para editar.', 'error');
        return;
    }
    // Verificar bloqueo
    try {
        var checkRes = await apiFetch(API_BLOQUEOS + '/check', { method: 'POST', body: JSON.stringify({ tipo: 'editar', id: id }) });
        var checkJson = await checkRes.json();

        if (checkJson.locked) {
            showToast('El trabajador esta siendo editado por: ' + checkJson.usuario + '. Espere e intente nuevamente.', 'error');
            return;
        }

        // Adquirir bloqueo
        var lockRes = await apiFetch(API_BLOQUEOS + '/acquire', { method: 'POST', body: JSON.stringify({ tipo: 'editar', id: id }) });
        var lockJson = await lockRes.json();

        if (lockJson.success) {
            openEditModal(id);
        } else {
            showToast(lockJson.message || 'No se pudo adquirir el bloqueo', 'error');
        }
    } catch(e) {
        showToast(connError(API_BLOQUEOS + '/check', e), 'error');
    }
}

// ============================================================
// EDITAR TRABAJADOR
// ============================================================
function formatDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('es-ES'); } catch(e) { return d; }
}

function formatSexo(s) {
    return s == 1 ? 'Femenino' : (s == 2 ? 'Masculino' : '—');
}

function formatAltoRiesgo(t) {
    var esAR = t.es_alto_riesgo === true || t.es_alto_riesgo === 't';
    if (!esAR) return 'No';
    var label = t.tipo_alto_riesgo || 'AR';
    if (t.subcategoria_operario) label += ' (' + t.subcategoria_operario + ')';
    if (t.subcategoria_chofer) label += ' (' + t.subcategoria_chofer + ')';
    return label;
}

async function openEditModal(id) {
    await loadDivisiones();
    await loadEnfermedades();
    populateCheckboxes('edit_enfermedadesCheckboxes');

    try {
        var res = await fetch(API_BASE + '/' + id);
        var t = await res.json();

        document.getElementById('edit_id').value = id;
        document.getElementById('editDateTime').textContent = new Date().toLocaleString('es-ES');

        // Llenar campos informativos
        document.getElementById('edit_display_id_numerico').textContent = t.id_numerico || '—';
        document.getElementById('edit_display_nombre').textContent = t.nombre || '—';
        document.getElementById('edit_display_fecha_nac').textContent = formatDate(t.fecha_nacimiento);
        document.getElementById('edit_display_sexo').textContent = formatSexo(t.sexo);
        document.getElementById('edit_display_division').textContent = t.division_nombre || '—';
        document.getElementById('edit_display_altoriesgo').textContent = formatAltoRiesgo(t);

        // Llenar campo editable: cargo (con autocompletado del catalogo de posiciones)
        var cargoInput = document.getElementById('edit_cargo');
        if (cargoInput) cargoInput.value = t.cargo || '';

        // Llenar campo editable: unidad organizativa (con autocompletado del catalogo de unidades)
        var unidadInput = document.getElementById('edit_unidad');
        if (unidadInput) unidadInput.value = t.unidad_organizativa || '';

        // Llenar campo editable: tipo de sangre
        var form = document.getElementById('editTrabajadorForm');
        if (t.tipo_sangre) {
            setVal(form, 'tipo_sangre', t.tipo_sangre);
        }

        // Llenar campo editable: fecha de ultimo chequeo
        var chequeoInput = document.getElementById('edit_fecha_chequeo');
        if (chequeoInput && t.fecha_ultimo_chequeo) {
            var d = new Date(t.fecha_ultimo_chequeo);
            if (!isNaN(d.getTime())) {
                chequeoInput.value = d.toISOString().split('T')[0];
            }
        }

        // Llenar campo editable: chequeo medico especializado de chofer
        var chequeoChoferInput = document.getElementById('edit_fecha_chequeo_chofer');
        if (chequeoChoferInput && t.fecha_chequeo_chofer) {
            var dc = new Date(t.fecha_chequeo_chofer);
            if (!isNaN(dc.getTime())) {
                chequeoChoferInput.value = dc.toISOString().split('T')[0];
            }
        }

        // Llenar campo editable: enfermedades
        if (t.enfermedades_ids && Array.isArray(t.enfermedades_ids)) {
            t.enfermedades_ids.forEach(function(eid) {
                var cb = form.querySelector('input[name="enfermedades[]"][value="' + eid + '"]');
                if (cb) cb.checked = true;
            });
        }

        // Llenar campo editable: donante de sangre
        var donanteCb = document.getElementById('edit_es_donante');
        if (donanteCb) {
            donanteCb.checked = t.es_donante === true || t.es_donante === 't';
        }

        // Llenar campo editable: maternidad
        var embarazadaCb = document.getElementById('edit_embarazada');
        if (embarazadaCb) {
            embarazadaCb.checked = t.embarazada === true || t.embarazada === 't';
        }
        var gestacionInput = document.getElementById('edit_fecha_gestacion');
        if (gestacionInput && t.fecha_gestacion_inicio) {
            gestacionInput.value = String(t.fecha_gestacion_inicio).slice(0, 10);
        }

        document.getElementById('editModal').classList.add('open');
        hasUnsavedChanges = true;
    } catch(e) {
        showToast(connError(API_BASE + '/' + id, e), 'error');
    }
}

function closeEditModal() {
    var id = document.getElementById('edit_id').value;
    if (id) {
        apiFetch(API_BLOQUEOS + '/release', { method: 'POST', body: JSON.stringify({ tipo: 'editar', id: id }) });
    }
    hasUnsavedChanges = false;
    closeModal('editModal');
}

async function saveEditTrabajador() {
    var form = document.getElementById('editTrabajadorForm');
    var fd = new FormData(form);
    var id = document.getElementById('edit_id').value;

    var enfermedades = [];
    fd.forEach(function(v, k) {
        if (k === 'enfermedades[]') enfermedades.push(v);
    });
    var tipo_sangre = fd.get('tipo_sangre') || '';
    var fecha_ultimo_chequeo = fd.get('fecha_ultimo_chequeo') || '';
    var fecha_chequeo_chofer = fd.get('fecha_chequeo_chofer') || '';
    var cargo = fd.get('cargo') || '';
    var unidad_organizativa = fd.get('unidad_organizativa') || '';
    var es_donante = document.getElementById('edit_es_donante') ? document.getElementById('edit_es_donante').checked : false;
    var embarazada = document.getElementById('edit_embarazada') ? document.getElementById('edit_embarazada').checked : false;
    var fecha_gestacion_inicio = document.getElementById('edit_fecha_gestacion') ? document.getElementById('edit_fecha_gestacion').value || null : null;

    var body = { enfermedades: enfermedades, tipo_sangre: tipo_sangre, fecha_ultimo_chequeo: fecha_ultimo_chequeo, fecha_chequeo_chofer: fecha_chequeo_chofer, cargo: cargo, unidad_organizativa: unidad_organizativa, es_donante: es_donante, embarazada: embarazada, fecha_gestacion_inicio: fecha_gestacion_inicio };

    var err = document.getElementById('editFormError');
    err.style.display = 'none';

    var saveBtn = document.querySelector('#editModal .modal-footer .btn-primary');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'Guardando...';
    }

    try {
        var res = await apiFetch(API_BASE + '/' + id, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        var json = await res.json();
        if (json.success) {
            closeModal('editModal');
            await apiFetch(API_BLOQUEOS + '/release', { method: 'POST', body: JSON.stringify({ tipo: 'editar', id: id }) });
            showToast('Trabajador actualizado correctamente', 'success');
            loadTrabajadores(currentDivisionFilter);
        } else {
            err.textContent = json.error || 'Error al guardar';
            err.style.display = 'block';
        }
    } catch(e) {
        err.textContent = connError(API_BASE + '/' + id, e);
        err.style.display = 'block';
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios';
        }
    }
}

function buildBodyFromForm(fd) {
    var body = {};
    fd.forEach(function(v, k) {
        if (k === 'enfermedades[]') {
            if (!body['enfermedades']) body['enfermedades'] = [];
            body['enfermedades'].push(v);
        } else if (k !== 'nombre' && k !== 'primer_apellido' && k !== 'segundo_apellido') {
            body[k] = v;
        }
    });
    return body;
}

// ============================================================
// VALIDACION DEL LADO DEL CLIENTE
// ============================================================
function validateFormClient(data, isEdit) {
    if (!data.nombre || data.nombre.trim() === '') return 'El nombre es requerido';
    if (data.nombre.length > 200) return 'El nombre no puede exceder 200 caracteres';
    if (!data.cargo || data.cargo.trim() === '') return 'El cargo es requerido';
    if (data.cargo.length > 150) return 'El cargo no puede exceder 150 caracteres';
    if (!isEdit && (!data.id_numerico || data.id_numerico.trim() === '')) return 'El numero de personal es requerido';

    if (data.fecha_nacimiento) {
        var fn = new Date(data.fecha_nacimiento);
        if (isNaN(fn.getTime())) return 'La fecha de nacimiento no es valida';
        if (fn > new Date()) return 'La fecha de nacimiento no puede ser futura';
    } else if (!isEdit) {
        return 'La fecha de nacimiento es requerida';
    }

    if (data.fecha_ultimo_chequeo) {
        var fc = new Date(data.fecha_ultimo_chequeo);
        if (isNaN(fc.getTime())) return 'La fecha de ultimo chequeo no es valida';
        if (fc > new Date()) return 'La fecha de ultimo chequeo no puede ser futura';
    }

    if (data.sexo && data.sexo !== '1' && data.sexo !== '2') return 'El sexo debe ser Masculino o Femenino';

    if (data.es_alto_riesgo == '1' || data.es_alto_riesgo === true) {
        var tiposValidos = ['chofer', 'liniero', 'torrero', 'operario_cables', 'operador_grua'];
        if (!data.tipo_alto_riesgo || tiposValidos.indexOf(data.tipo_alto_riesgo) === -1) {
            return 'Debe seleccionar un tipo de alto riesgo valido';
        }
        if (data.tipo_alto_riesgo === 'operario_cables' && !data.subcategoria_operario) {
            return 'La subcategoria es requerida para Operario de Cables';
        }
    }

    return null; // Sin errores
}

// ============================================================
// QUICK VIEW
// ============================================================
async function quickView(id) {
    try {
        var res = await fetch(API_BASE + '/' + id);
        var t = await res.json();
        var html = '<div class="grid-2" style="margin-bottom:14px">' +
            '<div><strong>No. Personal:</strong> ' + t.id_numerico + '</div>' +
            '<div><strong>Nombre:</strong> ' + t.nombre + '</div>' +
            '<div><strong>Nacimiento:</strong> ' + (t.fecha_nacimiento ? new Date(t.fecha_nacimiento).toLocaleDateString('es-ES') : '&#8212;') + '</div>' +
            '<div><strong>Cargo:</strong> ' + t.cargo + '</div>' +
            '<div><strong>Unidad Organizativa:</strong> ' + (t.unidad_organizativa || '&#8212;') + '</div>' +
            '<div><strong>Division:</strong> ' + (t.division_nombre || '&#8212;') + '</div>' +
            '<div><strong>Sexo:</strong> ' + (t.sexo == 1 ? 'Femenino' : 'Masculino') + '</div>' +
            '<div><strong>Tipo de Sangre:</strong> ' + (t.tipo_sangre || '&#8212;') + '</div>' +
            '<div><strong>Alto Riesgo:</strong> ' + ((t.es_alto_riesgo===true||t.es_alto_riesgo==='t') ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:2px"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6z"/></svg> ' + t.tipo_alto_riesgo : 'No') + '</div>' +
            '<div><strong>Ult. Chequeo:</strong> ' + (t.fecha_ultimo_chequeo ? new Date(t.fecha_ultimo_chequeo).toLocaleDateString('es-ES') : '&#8212;') + '</div>' +
            '<div><strong>Enfermedades:</strong> ' + (t.enfermedades_lista || '&#8212;') + '</div>' +
            '</div>';
        document.getElementById('quickViewBody').innerHTML = html;
        document.getElementById('quickViewModal').classList.add('open');
    } catch(e) {
        showToast(connError(API_BASE + '/' + id, e), 'error');
    }
}

// ============================================================
// BUSQUEDA FLOTANTE
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('floatSearchBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            document.getElementById('floatSearchModal').classList.add('open');
            document.getElementById('floatSearchInput').focus();
        });
    }
    loadQuickStats();
    loadDivisiones();
    loadEnfermedades();
    loadUOs();
    loadEditDatalists();
});

function getActiveSection() {
    var sections = document.querySelectorAll('[id^="section-"]');
    for (var i = 0; i < sections.length; i++) {
        if (!sections[i].classList.contains('hidden')) {
            return sections[i].id.replace('section-', '');
        }
    }
    return 'trabajadores';
}

var searchTimeout;
async function doFloatSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async function() {
        var q = document.getElementById('floatSearchInput').value.trim();
        var resultsDiv = document.getElementById('floatSearchResults');
        if (q.length < 2) { resultsDiv.innerHTML = ''; return; }
        var section = getActiveSection();
        try {
            var results = [];
            if (section === 'donantes') {
                var res = await fetch(API_DONANTES + '/search?q=' + encodeURIComponent(q));
                var json = await res.json();
                results = json.data || [];
            } else {
                var res = await fetch(API_BASE + '/search/' + encodeURIComponent(q));
                var json = await res.json();
                results = json.data || [];
            }
            var html = '';
            if (!results.length) {
                html = '<div class="alert alert-info">Sin resultados</div>';
            } else {
                results.forEach(function(t) {
                    if (section === 'donantes') {
                        html += '<div style="padding:12px;border:1px solid var(--gray-light);border-radius:var(--radius);margin-bottom:8px">' +
                            '<div class="d-flex justify-between align-center">' +
                            '<div><div style="font-weight:700;color:var(--blue)">' + (t.trabajador_nombre || t.nombre) + '</div>' +
                            '<div style="font-size:12px;color:var(--gray)">' + (t.tipo_sangre || '') + ' &middot; ' + (t.fecha_donacion ? new Date(t.fecha_donacion).toLocaleDateString('es-ES') : '') + '</div></div>' +
                            '<div class="d-flex gap-2 align-center">' +
                            '<span class="badge badge-blue" style="font-family:monospace">' + (t.id_numerico || '') + '</span>' +
                            '</div></div></div>';
                    } else {
                        var ar = t.es_alto_riesgo === true || t.es_alto_riesgo === 't';
                        html += '<div style="padding:12px;border:1px solid var(--gray-light);border-radius:var(--radius);margin-bottom:8px">' +
                            '<div class="d-flex justify-between align-center">' +
                            '<div style="cursor:pointer" onclick="closeModal(\'floatSearchModal\'); quickView(' + t.id + ')"><div style="font-weight:700;color:var(--blue)">' + t.nombre + '</div>' +
                            '<div style="font-size:12px;color:var(--gray)">' + t.cargo + ' &middot; ' + (t.unidad_organizativa||'&#8212;') + '</div></div>' +
                            '<div class="d-flex gap-2 align-center">' +
                            '<span class="badge badge-blue" style="font-family:monospace">' + t.id_numerico + '</span>' +
                            (ar ? ' <span class="badge badge-danger"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6z"/></svg></span>' : '') +
                            '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); closeModal(\'floatSearchModal\'); acquireAndEdit(' + t.id + ')">Editar</button>' +
                            '</div></div></div>';
                    }
                });
            }
            resultsDiv.innerHTML = html;
        } catch(e) {
            var api = section === 'donantes' ? API_DONANTES + '/search?q=' + q : API_BASE + '/search/' + q;
            resultsDiv.innerHTML = '<div class="alert alert-error">' + connError(api, e) + '</div>';
        }
    }, 300);
}

// ============================================================
// HELPERS
// ============================================================
function closeModal(id) {
    var el = document.getElementById(id);
    if (el) {
        el.classList.remove('open');
        el.classList.remove('active');
    }
}

function toggleAltoRiesgo(val, prefix) {
    var f = document.getElementById((prefix||'add') + '_altoRiesgoFields');
    if (f) f.style.display = val === '1' ? 'block' : 'none';
}

function toggleTipoRiesgo(val, prefix) {
    var g = document.getElementById((prefix||'add') + '_subcategoriaGroup');
    if (g) g.style.display = val === 'operario_cables' ? 'block' : 'none';
}

function toggleMaternidad(val, prefix) {
    var f = document.getElementById((prefix||'add') + '_maternidadFields');
    if (f) f.style.display = val === '1' ? 'block' : 'none';
}

async function loadDivisiones() {
    if (divisiones.length) return;
    try {
        var res = await fetch(API_DIVISIONES);
        divisiones = await res.json();
    } catch(e) {
        console.error('[loadDivisiones] error:', e);
    }
}

async function loadEnfermedades() {
    if (enfermedades.length) return;
    try {
        var res = await fetch(API_ENFERMEDADES);
        enfermedades = await res.json();
    } catch(e) {
        console.error('[loadEnfermedades] error:', e);
    }
}

function populateSelect(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel || !divisiones.length) return;
    var parents = divisiones.filter(function(d) { return !d.parent_id; });
    var html = '<option value="">&#8212; Seleccionar Division &#8212;</option>';
    parents.forEach(function(p) {
        html += '<optgroup label="' + p.nombre + '">';
        divisiones.filter(function(d) { return d.parent_id == p.id; }).forEach(function(sub) {
            html += '<option value="' + sub.id + '">' + sub.nombre + '</option>';
        });
        html += '</optgroup>';
    });
    sel.innerHTML = html;
}

function populateCheckboxes(containerId) {
    var c = document.getElementById(containerId);
    if (!c || !enfermedades.length) return;
    c.innerHTML = enfermedades.map(function(e) {
        return '<label style="display:flex;align-items:center;gap:5px;font-size:12px;background:var(--gray-bg);border:1px solid var(--gray-light);border-radius:var(--radius);padding:4px 10px;cursor:pointer">' +
            '<input type="checkbox" name="enfermedades[]" value="' + e.id + '"> <span>' + e.nombre + '</span></label>';
    }).join('');
}

async function loadEditDatalists() {
    try {
        var posRes = await fetch('/api/posiciones');
        var posJson = await posRes.json();
        var cargoList = document.getElementById('editCargoList');
        if (cargoList) {
            cargoList.innerHTML = (posJson.data || []).map(function(p) {
                return '<option value="' + String(p.nombre).replace(/"/g, '&quot;') + '"></option>';
            }).join('');
        }
    } catch(e) {}
    try {
        var uoRes = await fetch(API_BASE + '/unidades-organizativas');
        var uoJson = await uoRes.json();
        var uoList = document.getElementById('editUOList');
        if (uoList) {
            uoList.innerHTML = (uoJson || []).map(function(u) {
                return '<option value="' + String(u.unidad_organizativa).replace(/"/g, '&quot;') + '"></option>';
            }).join('');
        }
    } catch(e) {}
}

function setVal(form, name, val) {
    var el = form.querySelector('[name="' + name + '"]');
    if (el && val !== null && val !== undefined) el.value = val;
}

function showLoading(container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando...</div>';
}

function toggleSelectAllTrabajadores(el) {
    var cbs = document.querySelectorAll('#trabajadoresTable tbody .trabajador-check');
    cbs.forEach(function(cb) {
        cb.checked = el.checked;
        var id = parseInt(cb.value);
        if (el.checked) selectedTrabajadoresIds[id] = true;
        else delete selectedTrabajadoresIds[id];
    });
    updateSelectedCount();
}

function onTrabajadorCheckChange(cb) {
    var id = parseInt(cb.value);
    if (cb.checked) selectedTrabajadoresIds[id] = true;
    else delete selectedTrabajadoresIds[id];
    updateSelectedCount();
}

function updateSelectedCount() {
    var count = Object.keys(selectedTrabajadoresIds).length;
    var badge = document.getElementById('selectedCountBadge');
    var c = document.getElementById('selectedCount');
    if (c) c.textContent = count;
    if (badge) badge.style.display = count ? '' : 'none';
    var selectAll = document.getElementById('selectAllTrabajadores');
    if (selectAll) {
        var cbs = document.querySelectorAll('#trabajadoresTable tbody .trabajador-check');
        selectAll.checked = cbs.length > 0 && Array.prototype.every.call(cbs, function(cb) { return cb.checked; });
    }
}

function exportSelected(format) {
    var ids = Object.keys(selectedTrabajadoresIds);
    if (!ids.length) {
        showToast('Seleccione al menos un trabajador para exportar', 'error');
        return;
    }
    window.open('/api/export/' + format + '/trabajadores?ids=' + ids.join(','), '_blank');
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
