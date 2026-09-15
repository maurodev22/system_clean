// ============================================================
// importar.js - Importacion de trabajadores desde Excel/CSV
// Columnas requeridas: Numero de personal, Nombre, Primer apellido,
// Segundo Apellido, Carne Identidad, Edad, Sexo, Unidad Organizativa, Posicion
// Incluye: deteccion de alto riesgo, mapeo de columnas, vista previa
// ============================================================

var importData = [];
var importCurrentPage = 1;
var importPerPage = 15;
var importAuthorized = false;
var POSICIONES_LOOKUP = null;

function normPos(s) {
    return (s || '').toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/["""\u201C\u201D\u2018\u2019]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

async function loadPosicionesLookup() {
    if (POSICIONES_LOOKUP) return POSICIONES_LOOKUP;
    POSICIONES_LOOKUP = {};
    try {
        var res = await fetch('/api/posiciones');
        var json = await res.json();
        var map = {};
        (json.data || []).forEach(function(p) {
            map[normPos(p.nombre)] = p;
        });
        POSICIONES_LOOKUP = map;
    } catch(e) {}
    return POSICIONES_LOOKUP;
}

// Mapa de posiciones que clasifican como Alto Riesgo
var ALTO_RIESGO_MAP = {
    'grua':                     'operador_grua',
    'liniero':                  'liniero',
    'linieros':                 'liniero',
    'torrero':                  'torrero',
    'torreros':                 'torrero',
    'operario de cable':        'operario_cables',
    'operarios de cable':       'operario_cables',
    'operario cables':          'operario_cables',
    'operario "a"':             'operario_cables',
    'operario "b"':             'operario_cables',
    'probador':                 'operario_cables',
    'traza de cable':           'operario_cables',
    'op. traza':                'operario_cables',
    'instal. reparador':        'operario_cables',
    'instal reparador':         'operario_cables',
    'reparador':                'operario_cables',
    'omnibus':                  'chofer',
    'chofer':                   'chofer',
    'choferes':                 'chofer',
};

function detectAltoRiesgo(posicion) {
    if (!posicion) return { es: false, tipo: null, subcategoria: null };
    var p = posicion.toLowerCase().trim();
    for (var key in ALTO_RIESGO_MAP) {
        if (p.indexOf(key) !== -1) {
            var tipo = ALTO_RIESGO_MAP[key];
            var subcategoria = null;
            var subMatch = p.match(/["""\u201C\u201D]?([a-d])["""\u201C\u201D]?\s*(?:de\s+|\s*$)/i);
            if (subMatch) subcategoria = subMatch[1].toUpperCase();
            return { es: true, tipo: tipo, subcategoria: subcategoria };
        }
    }
    return { es: false, tipo: null, subcategoria: null };
}

// Normalizar nombre de columna
function normCol(s) {
    return (s || '').toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

// Mapa de columnas reconocidas
var COL_MAP = {
    'numerodepersonal': 'id_numerico',
    'numpersonal':      'id_numerico',
    'numero':           'id_numerico',
    'numeros':          'id_numerico',
    'nopersonal':       'id_numerico',
    'nombre':           'nombre',
    'primerapellido':   'primer_apellido',
    'primerapell':      'primer_apellido',
    'segundoapellido':  'segundo_apellido',
    'segundoapell':     'segundo_apellido',
    'carneidentidad':   'carnet_identidad',
    'carnet':           'carnet_identidad',
    'ci':               'carnet_identidad',
    'edad':             'edad',
    'sexo':             'sexo',
    'unidadorganizativa':'unidad_organizativa',
    'unidad':           'unidad_organizativa',
    'posicion':         'cargo',
    'cargo':            'cargo',
    'puesto':           'cargo',
};

function mapHeaders(headers) {
    var map = {};
    headers.forEach(function(h, i) {
        var norm = normCol(h);
        if (COL_MAP[norm]) map[COL_MAP[norm]] = i;
    });
    return map;
}

function previewExcel(input) {
    var file = input.files[0];
    if (!file) return;

    // Validar extension
    var ext = file.name.split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'csv'].indexOf(ext) === -1) {
        document.getElementById('importResult').innerHTML = '<div class="alert alert-error">Formato de archivo no soportado. Use .xlsx, .xls o .csv</div>';
        document.getElementById('importResult').style.display = 'block';
        return;
    }

    var reader = new FileReader();

    if (ext === 'csv') {
        reader.onload = function(e) {
            var text = e.target.result;
            var sep = text.indexOf(';') !== -1 ? ';' : ',';
            var lines = text.split('\n').filter(function(l) { return l.trim(); });
            if (lines.length < 2) {
                document.getElementById('importResult').innerHTML = '<div class="alert alert-error">El archivo CSV esta vacio o no tiene datos.</div>';
                document.getElementById('importResult').style.display = 'block';
                return;
            }
            var headers = lines[0].split(sep).map(function(h) { return h.replace(/"/g, '').trim(); });
            var rows = [];
            for (var i = 1; i < lines.length; i++) {
                var cells = lines[i].split(sep).map(function(c) { return c.replace(/"/g, '').trim(); });
                var row = {};
                headers.forEach(function(h, j) { row[h] = cells[j] || ''; });
                rows.push(row);
            }
            loadPosicionesLookup().then(function() { processRows(headers, rows); });
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            var wb = XLSX.read(data, { type: 'array' });
            var ws = wb.Sheets[wb.SheetNames[0]];
            var rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
            if (rows.length === 0) {
                document.getElementById('importResult').innerHTML = '<div class="alert alert-error">El archivo Excel esta vacio.</div>';
                document.getElementById('importResult').style.display = 'block';
                return;
            }
            var headers = rows.length ? Object.keys(rows[0]) : [];
            loadPosicionesLookup().then(function() { processRows(headers, rows); });
        };
        reader.readAsArrayBuffer(file);
    }
}

function processRows(headers, rows) {
    var colMap = mapHeaders(headers);
    importData = [];

    rows.forEach(function(row) {
        function getVal(field) {
            if (colMap[field] !== undefined) {
                var keys = Object.keys(row);
                return (row[keys[colMap[field]]] || '').toString().trim();
            }
            for (var k in row) {
                if (normCol(k) === normCol(field)) return (row[k] || '').toString().trim();
            }
            return '';
        }

        var idNum    = getVal('id_numerico');
        var nombre   = getVal('nombre');
        var ap1      = getVal('primer_apellido');
        var ap2      = getVal('segundo_apellido');
        var ci       = getVal('carnet_identidad');
        var edad     = getVal('edad');
        var sexoRaw  = getVal('sexo');
        var unidad   = getVal('unidad_organizativa');
        var cargo    = getVal('cargo');

        if (!idNum && !nombre && !cargo) return; // fila vacia

        // Normalizar sexo
        var sexo = 2;
        var sl = sexoRaw.toString().toLowerCase();
        if (sl === '1' || sl === 'f' || sl === 'femenino' || sl === 'mujer') sexo = 1;
        else if (sl === '2' || sl === 'm' || sl === 'masculino' || sl === 'hombre') sexo = 2;

        // Calcular fecha de nacimiento desde CI o edad
        var fechaNac = '';
        if (ci && ci.length >= 6) {
            var yy = ci.substring(0, 2);
            var mm = ci.substring(2, 4);
            var dd = ci.substring(4, 6);
            var yyyy = parseInt(yy) > 25 ? '19' + yy : '20' + yy;
            fechaNac = yyyy + '-' + mm + '-' + dd;
        } else if (edad) {
            var anio = new Date().getFullYear() - parseInt(edad);
            fechaNac = anio + '-01-01';
        }

        var ar = detectAltoRiesgo(cargo);
        var ref = POSICIONES_LOOKUP ? POSICIONES_LOOKUP[normPos(cargo)] : null;
        if (ref) {
            if (ref.alto_riesgo) {
                ar = { es: true, tipo: ref.tipo_alto_riesgo, subcategoria: ref.subcategoria };
            } else {
                ar = { es: false, tipo: null, subcategoria: null };
            }
        }
        var nombreCompleto = [nombre, ap1, ap2].filter(Boolean).join(' ');

        importData.push({
            id_numerico:        idNum,
            nombre:             nombreCompleto,
            primer_apellido:    ap1,
            segundo_apellido:   ap2,
            carnet_identidad:   ci,
            fecha_nacimiento:   fechaNac,
            sexo:               sexo,
            unidad_organizativa: unidad,
            cargo:              cargo,
            es_alto_riesgo:     ar.es ? 1 : 0,
            tipo_alto_riesgo:   ar.tipo,
            subcategoria_operario: ar.tipo === 'operario_cables' ? ar.subcategoria : null,
            subcategoria_chofer: ar.tipo === 'chofer' ? ar.subcategoria : null,
        });
    });

    showPreview();
}

function renderImportPage() {
    var wrapper = document.getElementById('importTableWrapper');
    var start = (importCurrentPage - 1) * importPerPage;
    var end = Math.min(start + importPerPage, importData.length);
    var pageData = importData.slice(start, end);

    var html = '<table style="font-size:12px"><thead><tr>' +
        '<th>#</th><th>No. Personal</th><th>Nombre Completo</th><th>CI</th>' +
        '<th>Sexo</th><th>Unidad Organizativa</th><th>Posicion</th>' +
        '<th>Alto Riesgo</th><th>F. Nac.</th></tr></thead><tbody>';

    pageData.forEach(function(r, i) {
        html += '<tr>' +
            '<td style="color:var(--gray);font-size:11px">' + (start + i + 1) + '</td>' +
            '<td>' + (r.id_numerico || '&#8212;') + '</td>' +
            '<td>' + (r.nombre || '&#8212;') + '</td>' +
            '<td>' + (r.carnet_identidad || '&#8212;') + '</td>' +
            '<td>' + (r.sexo == 1 ? 'Femenino' : 'Masculino') + '</td>' +
            '<td>' + (r.unidad_organizativa || '&#8212;') + '</td>' +
            '<td>' + (r.cargo || '&#8212;') + '</td>' +
            '<td>' + (r.es_alto_riesgo ? '<span class="badge badge-danger"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align:middle;margin-right:2px"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg> ' + r.tipo_alto_riesgo + '</span>' : '<span class="badge badge-gray">No</span>') + '</td>' +
            '<td>' + (r.fecha_nacimiento || '&#8212;') + '</td>' +
            '</tr>';
    });

    html += '</tbody></table>';

    // Paginacion
    var totalPages = Math.ceil(importData.length / importPerPage);
    if (totalPages > 1) {
        html += '<div class="pagination" style="margin-top:8px">' +
            '<button class="btn btn-sm btn-secondary" onclick="importGoToPage(1)" ' + (importCurrentPage <= 1 ? 'disabled' : '') + '>«</button>' +
            '<button class="btn btn-sm btn-secondary" onclick="importGoToPage(' + (importCurrentPage - 1) + ')" ' + (importCurrentPage <= 1 ? 'disabled' : '') + '>‹</button>';

        var startP = Math.max(1, importCurrentPage - 2);
        var endP = Math.min(totalPages, importCurrentPage + 2);
        for (var p = startP; p <= endP; p++) {
            html += '<button class="btn btn-sm ' + (p === importCurrentPage ? 'btn-primary' : 'btn-secondary') + '" onclick="importGoToPage(' + p + ')">' + p + '</button>';
        }

        html += '<button class="btn btn-sm btn-secondary" onclick="importGoToPage(' + (importCurrentPage + 1) + ')" ' + (importCurrentPage >= totalPages ? 'disabled' : '') + '>›</button>' +
            '<button class="btn btn-sm btn-secondary" onclick="importGoToPage(' + totalPages + ')" ' + (importCurrentPage >= totalPages ? 'disabled' : '') + '>»</button>' +
            '<span style="margin-left:8px;font-size:12px;color:var(--gray)">Página ' + importCurrentPage + ' de ' + totalPages + '</span>' +
            '<select class="form-control" style="width:auto;display:inline-block;margin-left:8px;padding:3px 6px;font-size:11px" onchange="importChangePerPage(this.value)">' +
            '<option value="10" ' + (importPerPage === 10 ? 'selected' : '') + '>10</option>' +
            '<option value="15" ' + (importPerPage === 15 ? 'selected' : '') + '>15</option>' +
            '<option value="25" ' + (importPerPage === 25 ? 'selected' : '') + '>25</option>' +
            '<option value="50" ' + (importPerPage === 50 ? 'selected' : '') + '>50</option>' +
            '</select></div>';
    }

    wrapper.innerHTML = html;
}

function importGoToPage(p) {
    importCurrentPage = p;
    renderImportPage();
}

function importChangePerPage(val) {
    importPerPage = parseInt(val);
    importCurrentPage = 1;
    renderImportPage();
}

async function showPreview() {
    var preview = document.getElementById('importPreview');
    var stats   = document.getElementById('importStats');
    var wrapper = document.getElementById('importTableWrapper');

    if (!importData.length) {
        document.getElementById('importResult').innerHTML = '<div class="alert alert-error">No se encontraron filas validas. Verifica que el archivo tenga las columnas correctas.</div>';
        document.getElementById('importResult').style.display = 'block';
        return;
    }

    importCurrentPage = 1;
    var arCount = importData.filter(function(r) { return r.es_alto_riesgo; }).length;

    // Detectar duplicados dentro del Excel
    var seen = {};
    var dupCount = 0;
    importData.forEach(function(r) {
        if (r.id_numerico) {
            if (seen[r.id_numerico]) { dupCount++; }
            seen[r.id_numerico] = true;
        }
    });

    // Detectar duplicados contra la BD
    var dbDupCount = 0;
    try {
        var nums = importData.map(function(r) { return r.id_numerico; }).filter(Boolean);
        if (nums.length) {
            var csrf = document.querySelector('meta[name="csrf-token"]'); var token = csrf ? csrf.content : '';
            var res = await fetch('/api/trabajadores/import/check-duplicates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify({ id_numericos: nums })
            });
            var json = await res.json();
            if (json.existing) dbDupCount = json.existing.length;
        }
    } catch(e) {}

    var parts = [
        '<span class="badge badge-blue">' + importData.length + ' registros encontrados</span>',
        '<span class="badge badge-danger">' + arCount + ' Alto Riesgo</span>'
    ];
    if (dupCount > 0) parts.push('<span class="badge badge-warning">' + dupCount + ' duplicados en Excel</span>');
    if (dbDupCount > 0) parts.push('<span class="badge badge-warning">' + dbDupCount + ' existentes en BD (se actualizaran)</span>');
    stats.innerHTML = '<div class="d-flex gap-2" style="flex-wrap:wrap">' + parts.join('') + '</div>';

    renderImportPage();
    preview.style.display = 'block';
    document.getElementById('importResult').style.display = 'none';
}

async function confirmImport() {
    if (!importData.length) return;
    document.getElementById('confirmImportText').textContent = '¿Esta seguro de importar ' + importData.length + ' registros?';
    document.getElementById('confirmImportModal').classList.add('open');
}

async function executeImport() {
    closeModal('confirmImportModal');
    var importCount = importData.length;
    var progress = document.getElementById('importProgress');
    var result = document.getElementById('importResult');
    var confirmBtn = document.querySelector('#confirmImportModal .modal-footer .btn-primary');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Importando...'; }
    progress.style.display = 'inline';
    progress.textContent = 'Importando ' + importCount + ' registros...';
    result.style.display = 'none';

    try {
        var csrf = document.querySelector('meta[name="csrf-token"]'); var token = csrf ? csrf.content : '';
        var res = await fetch('/api/trabajadores/import/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
            body: JSON.stringify({ rows: importData })
        });
        var json = await res.json();

        if (json.error) {
            result.innerHTML = '<div class="alert alert-error">' + json.error + '</div>';
        } else {
            var inserted = json.inserted || 0;
            var updated = json.updated || 0;
            var fail = json.fail || 0;
            var errors = json.errors || [];
            var msg = '<div class="alert alert-' + (fail ? 'warning' : 'success') + '">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Insertados: <strong>' + inserted + '</strong> &nbsp;|&nbsp; ' +
                'Actualizados: <strong>' + updated + '</strong> &nbsp;|&nbsp; ' +
                'Fallidos: <strong>' + fail + '</strong></div>';
            if (errors.length) {
                msg += '<div class="alert alert-error" style="margin-top:8px;font-size:12px">' +
                    errors.slice(0, 10).join('<br>') +
                    (errors.length > 10 ? '<br>...y ' + (errors.length-10) + ' mas' : '') + '</div>';
            }
            result.innerHTML = msg;
        }
    } catch(e) {
        result.innerHTML = '<div class="alert alert-error">' + connError('/api/trabajadores/import/execute', e) + '</div>';
    }

    progress.style.display = 'none';
    result.style.display = 'block';
    document.getElementById('importPreview').style.display = 'none';
    importData = [];
    document.getElementById('excelFileInput').value = '';
    if (typeof loadQuickStats === 'function') {
        loadQuickStats();
    }
}

function cancelImport() {
    importData = [];
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importResult').style.display = 'none';
    document.getElementById('excelFileInput').value = '';
}

function showImportLoginModal() {
    document.getElementById('importLoginModal').classList.add('open');
    document.getElementById('importLoginUser').value = '';
    document.getElementById('importLoginPass').value = '';
    document.getElementById('importLoginPass').focus();
    document.getElementById('importLoginError').style.display = 'none';
}

async function verifyImportCredentials() {
    var username = document.getElementById('importLoginUser').value.trim();
    var password = document.getElementById('importLoginPass').value;
    var error = document.getElementById('importLoginError');

    if (!username || !password) {
        error.textContent = 'Ingrese usuario y contrasena';
        error.style.display = 'block';
        return;
    }

    try {
        var csrf = document.querySelector('meta[name="csrf-token"]'); var token = csrf ? csrf.content : '';
        var res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ username: username, password: password })
        });
        var json = await res.json();

        if (json.success) {
            importAuthorized = true;
            document.getElementById('importLoginModal').classList.remove('open');
            document.getElementById('importAuthPrompt').style.display = 'none';
            document.getElementById('importFileSection').style.display = 'block';
            if (typeof showToast === 'function') {
                showToast('Acceso concedido como ' + username, 'success');
            }
        } else {
            error.textContent = json.message || 'Credenciales incorrectas';
            error.style.display = 'block';
        }
    } catch (e) {
        error.textContent = connError('/login', e);
        error.style.display = 'block';
    }
}

function showImportSection() {
    if (importAuthorized) {
        document.getElementById('importAuthPrompt').style.display = 'none';
        document.getElementById('importFileSection').style.display = 'block';
    } else {
        document.getElementById('importAuthPrompt').style.display = 'block';
        document.getElementById('importFileSection').style.display = 'none';
    }
}
