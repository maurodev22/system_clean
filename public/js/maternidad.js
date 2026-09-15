// ============================================================
// maternidad.js - Control de gestacion y licencia de maternidad
// Reglas: gestacion 9 meses; licencia de maternidad de 1 ano
// natural a partir del mes 6 (inicio de gestacion + 6 meses).
// Estados: a_otorgar / otorgado / a_incorporacion (automaticos
// segun la fecha actual, con posibilidad de ajuste manual).
// ============================================================

const MATERNIDAD_LABELS = {
    a_otorgar: 'A otorgar',
    otorgado: 'Otorgado',
    a_incorporacion: 'A incorporacion',
    sin_registro: 'Sin registro'
};

async function loadMaternidad() {
    var container = document.getElementById('maternidadContent');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando...</div>';

    try {
        var res = await fetchWithTimeout('/api/trabajadores/maternidad', { headers: { 'Accept': 'application/json' } }, 20000);
        var json = await res.json();
        var data = json.data || [];

        var estados = { a_otorgar: 0, otorgado: 0, a_incorporacion: 0 };
        data.forEach(function(t) {
            if (estados[t.estado] !== undefined) estados[t.estado]++;
        });

        var html = '<div class="d-flex justify-between align-center" style="margin-bottom:16px">' +
            '<div class="section-title" style="margin:0">Control de Maternidad (' + data.length + ')</div>' +
            '<div class="d-flex gap-2">' +
            '<span class="badge badge-blue">A otorgar: ' + estados.a_otorgar + '</span>' +
            '<span class="badge badge-warning">Otorgado: ' + estados.otorgado + '</span>' +
            '<span class="badge badge-green">A incorporacion: ' + estados.a_incorporacion + '</span>' +
            '</div></div>';

        html += '<div class="alert alert-info" style="font-size:12.5px">' +
            'Gestacion: <strong>9 meses</strong>. La licencia de maternidad se otorga a partir del <strong>mes 6</strong> y dura <strong>1 ano natural</strong> (fin = inicio de gestacion + 18 meses). ' +
            'El estado <strong>A incorporacion</strong> se senala a partir del <strong>ultimo mes</strong> de la licencia (1 mes antes de su vencimiento). ' +
            'Los estados se calculan automaticamente con las fechas y pueden ajustarse manualmente con el boton Editar.</div>';

        if (!data.length) {
            html += '<div class="alert alert-info">No hay trabajadoras en periodo de gestacion o maternidad registradas.<br><small>Para registrar una embarazada: vaya a <strong>Trabajadores</strong>, busque a la trabajadora, pulse <strong>Editar</strong> y marque la casilla <strong>Embarazada / en periodo de maternidad</strong>, indicando el inicio de la gestacion.</small></div>';
        } else {
            html += '<div class="table-wrapper"><table><thead><tr>' +
                '<th>No.</th><th>Nombre</th><th>Unidad Organizativa</th><th>Inicio Gestacion</th>' +
                '<th>Mes</th><th>Inicio Licencia</th><th>Fin Licencia</th><th>Estado</th><th>Acciones</th>' +
                '</tr></thead><tbody>';

            data.forEach(function(t) {
                var badgeClass = t.estado === 'a_otorgar' ? 'badge-blue' : (t.estado === 'otorgado' ? 'badge-warning' : 'badge-green');
                var estadoLabel = MATERNIDAD_LABELS[t.estado] || t.estado || '&#8212;';
                var esManual = t.estado_manual ? ' <small style="font-size:10px;color:var(--gray)">(manual)</small>' : '';
                var mes = t.mes_gestacion !== null ? t.mes_gestacion + '/9' : '&#8212;';
                html += '<tr>' +
                    '<td><span class="badge badge-blue" style="font-family:monospace">' + t.id_numerico + '</span></td>' +
                    '<td><strong>' + t.nombre + '</strong></td>' +
                    '<td><small>' + (t.unidad_organizativa || '&#8212;') + '</small></td>' +
                    '<td>' + (t.fecha_gestacion_inicio ? new Date(t.fecha_gestacion_inicio).toLocaleDateString('es-ES') : '&#8212;') + '</td>' +
                    '<td><strong>' + mes + '</strong></td>' +
                    '<td>' + (t.licencia_inicio ? new Date(t.licencia_inicio).toLocaleDateString('es-ES') : '&#8212;') + '</td>' +
                    '<td>' + (t.licencia_fin ? new Date(t.licencia_fin).toLocaleDateString('es-ES') : '&#8212;') + '</td>' +
                    '<td><span class="badge ' + badgeClass + '">' + estadoLabel + '</span>' + esManual + '</td>' +
                    '<td style="white-space:nowrap"><button class="btn btn-secondary btn-sm" onclick="openMaternidadModal(' + t.id + ')">Editar</button></td>' +
                    '</tr>';
            });
            html += '</tbody></table></div>';
        }

        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<div class="alert alert-error">' + connError('/api/trabajadores/maternidad', e) + '</div>';
    }
}

async function openMaternidadModal(id) {
    try {
        var res = await fetchWithTimeout('/api/trabajadores/' + id, { headers: { 'Accept': 'application/json' } }, 20000);
        var t = await res.json();

        var existing = document.getElementById('maternidadModal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.className = 'modal-overlay open';
        modal.id = 'maternidadModal';
        modal.innerHTML = '<div class="modal" style="max-width:560px">' +
            '<div class="modal-header"><span class="modal-title">Maternidad &mdash; ' + t.nombre + '</span>' +
            '<button class="btn-close" onclick="closeModal(\'maternidadModal\')">&times;</button></div>' +
            '<div class="modal-body">' +
            '<div id="maternidadError" class="alert alert-error" style="display:none"></div>' +
            '<div class="alert alert-info" style="font-size:12px">Gestacion: 9 meses. Licencia desde el mes 6 con duracion de 1 ano natural (inicio + 18 meses).</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Embarazada</label>' +
            '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">' +
            '<input type="checkbox" id="mat_embarazada" ' + (t.embarazada === true || t.embarazada === 't' ? 'checked' : '') + '> ' +
            '<span>Mujer embarazada / en periodo de maternidad</span></label></div>' +
            '<div class="form-group"><label class="form-label">Inicio de la Gestacion</label>' +
            '<input type="date" id="mat_fecha_gestacion" class="form-control" value="' + (t.fecha_gestacion_inicio || '') + '">' +
            '<small style="color:var(--gray)">La licencia se calcula automaticamente: inicio = gestacion + 6 meses, fin = gestacion + 18 meses.</small></div>' +
            '<div class="form-group"><label class="form-label">Estado (opcional, se calcula solo)</label>' +
            '<select id="mat_estado" class="form-control">' +
            '<option value="">&mdash; Automatico &mdash;</option>' +
            '<option value="a_otorgar">A otorgar</option>' +
            '<option value="otorgado">Otorgado</option>' +
            '<option value="a_incorporacion">A incorporacion</option>' +
            '</select><small style="color:var(--gray)">Dejar en "Automatico" para calcular segun la fecha actual.</small></div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-secondary" onclick="closeModal(\'maternidadModal\')">Cancelar</button>' +
            '<button class="btn btn-primary" onclick="saveMaternidad(' + t.id + ')">Guardar</button>' +
            '</div></div>';
        document.body.appendChild(modal);

        document.getElementById('mat_estado').value = t.maternidad_estado_manual || '';
    } catch(e) {
        showToast(connError('/api/trabajadores/' + id, e), 'error');
    }
}

async function saveMaternidad(id) {
    var err = document.getElementById('maternidadError');
    if (err) err.style.display = 'none';

    var body = {
        embarazada: document.getElementById('mat_embarazada').checked,
        fecha_gestacion_inicio: document.getElementById('mat_fecha_gestacion').value || null,
        maternidad_estado_manual: document.getElementById('mat_estado').value || null
    };

    var saveBtn = document.querySelector('#maternidadModal .modal-footer .btn-primary');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

    try {
        var csrf = document.querySelector('meta[name="csrf-token"]'); var token = csrf ? csrf.content : '';
        var res = await fetch('/api/trabajadores/' + id + '/maternidad', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
            body: JSON.stringify(body)
        });
        var json = await res.json();
        if (json.success) {
            closeModal('maternidadModal');
            showToast('Informacion de maternidad guardada', 'success');
            loadMaternidad();
        } else {
            if (err) { err.textContent = json.error || 'Error al guardar'; err.style.display = 'block'; }
            else showToast(json.error || 'Error al guardar', 'error');
        }
    } catch(e) {
        var url = '/api/trabajadores/' + id + '/maternidad';
        if (err) { err.textContent = connError(url, e); err.style.display = 'block'; }
        else showToast(connError(url, e), 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar'; }
    }
}
