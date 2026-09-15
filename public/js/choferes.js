// ============================================================
// choferes.js - Control de choferes de alto riesgo
// Chequeo Medico Especializado de Chofer: vigencia 1 ano
// Examen psicofisico completo (vista, oido, cardiovascular,
// neurologico, reflejos). Estados: Vigente / Proximo / Vencido
// ============================================================

async function loadChoferes() {
    const container = document.getElementById('trabajadoresContent');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando...</div>';

    const res = await fetch('/api/choferes');
    const json = await res.json();
    const data = json.data || [];

    const today = new Date();
    const dosAniosAtras = new Date(today.getFullYear()-2, today.getMonth(), today.getDate());
    const unAnioAtras = new Date(today.getFullYear()-1, today.getMonth(), today.getDate());

    let html = `
    <div class="d-flex justify-between align-center" style="margin-bottom:20px">
        <div>
            <h3 style="color:var(--blue)">Control de Choferes — Alto Riesgo</h3>
            <p style="color:var(--gray-500);font-size:13px">Recalificación cada 2 años · Examen psicofisiológico · Chequeo médico especializado de chofer (1 año)</p>
        </div>
        <div class="d-flex gap-2">
            <a href="/api/export/pdf/choferes" target="_blank" class="btn btn-secondary btn-sm">PDF</a>
            <a href="/api/export/excel/choferes" target="_blank" class="btn btn-secondary btn-sm">Excel</a>
        </div>
    </div>`;

    // Stats
    const recalPend = data.filter(c => !c.fecha_recalificacion || new Date(c.fecha_recalificacion) < dosAniosAtras).length;
    const psicoPend = data.filter(c => !c.fecha_examen_psicofisiologico || new Date(c.fecha_examen_psicofisiologico) < unAnioAtras).length;
    const chequeosPend = data.filter(c => !c.fecha_chequeo_especializado || new Date(c.fecha_chequeo_especializado) < unAnioAtras).length;
    const chequeoChoferPend = data.filter(c => !c.fecha_chequeo_chofer || new Date(c.fecha_chequeo_chofer) < unAnioAtras).length;

    html += `
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px">
        <div class="stat-card" style="flex:1;min-width:150px"><div class="stat-value" style="color:var(--blue)">${data.length}</div><div class="stat-label">Total Choferes</div></div>
        <div class="stat-card" style="flex:1;min-width:150px"><div class="stat-value" style="color:${recalPend > 0 ? 'var(--danger)' : 'var(--success)'}">${recalPend}</div><div class="stat-label">Recalificación Pendiente</div></div>
        <div class="stat-card" style="flex:1;min-width:150px"><div class="stat-value" style="color:${psicoPend > 0 ? 'var(--warning)' : 'var(--success)'}">${psicoPend}</div><div class="stat-label">Psicofisiológico Pendiente</div></div>
        <div class="stat-card" style="flex:1;min-width:150px"><div class="stat-value" style="color:${chequeoChoferPend > 0 ? 'var(--danger)' : 'var(--success)'}">${chequeoChoferPend}</div><div class="stat-label">Chequeo Chofer Pend. (1 año)</div></div>
        <div class="stat-card" style="flex:1;min-width:150px"><div class="stat-value" style="color:${chequeosPend > 0 ? 'var(--warning)' : 'var(--success)'}">${chequeosPend}</div><div class="stat-label">Chequeo Esp. Pendiente</div></div>
    </div>`;

    html += `
    <div class="table-container">
    <div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>ID</th><th>Nombre</th><th>Tipo Sangre</th><th>División</th><th>Chequeo Médico</th>
                <th>Recalificación (2 años)</th><th>Psicofisiológico</th><th>Chequeo Esp.</th>
                <th>Chequeo Chofer (1 año)</th><th>Estado</th><th>Acciones</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach(c => {
        const chequeo = c.fecha_ultimo_chequeo ? new Date(c.fecha_ultimo_chequeo) : null;
        const recal = c.fecha_recalificacion ? new Date(c.fecha_recalificacion) : null;
        const psico = c.fecha_examen_psicofisiologico ? new Date(c.fecha_examen_psicofisiologico) : null;
        const cheqEsp = c.fecha_chequeo_especializado ? new Date(c.fecha_chequeo_especializado) : null;
        const cheqChofer = c.fecha_chequeo_chofer ? new Date(c.fecha_chequeo_chofer) : null;

        const chequeoOk = chequeo && chequeo >= unAnioAtras;
        const recalOk = recal && recal >= dosAniosAtras;
        const psicoOk = psico && psico >= unAnioAtras;
        const cheqEspOk = cheqEsp && cheqEsp >= unAnioAtras;

        // Chequeo Chofer: vigencia 1 ano + alerta de vencimiento (30 dias)
        const cheqChoferExpiry = cheqChofer ? new Date(cheqChofer.getFullYear()+1, cheqChofer.getMonth(), cheqChofer.getDate()) : null;
        const cheqChoferOk = cheqChoferExpiry && cheqChoferExpiry > today;
        const cheqChoferPronto = cheqChoferExpiry && cheqChoferOk && (cheqChoferExpiry - today) <= 30*24*60*60*1000;

        const allOk = chequeoOk && recalOk && psicoOk && cheqEspOk && cheqChoferOk;

        const fmtDate = d => d ? d.toLocaleDateString('es-ES') : '—';
        const statusCell = (ok, d) =>
            `<span class="${ok ? 'chequeo-ok' : 'chequeo-vencido'}">${fmtDate(d)}</span>`;

        let cheqChoferCell = '—';
        if (cheqChofer) {
            let badge = cheqChoferPronto
                ? '<span class="badge badge-warning">Proximo</span>'
                : (cheqChoferOk
                    ? '<span class="badge badge-success">Vigente</span>'
                    : '<span class="badge badge-red">Vencido</span>');
            cheqChoferCell = `<div>${fmtDate(cheqChofer)} ${badge}</div>`;
        }

        html += `
        <tr>
            <td><span class="badge badge-blue" style="font-family:monospace">${c.id_numerico}</span></td>
            <td><strong>${c.nombre}</strong></td>
            <td><span class="badge badge-red" style="font-weight:700">${c.tipo_sangre || '—'}</span></td>
            <td><small>${c.unidad_organizativa || '—'}</small></td>
            <td>${statusCell(chequeoOk, chequeo)}</td>
            <td>${statusCell(recalOk, recal)}</td>
            <td>${statusCell(psicoOk, psico)}</td>
            <td>${statusCell(cheqEspOk, cheqEsp)}</td>
            <td>${cheqChoferCell}</td>
            <td>
                ${allOk
                    ? '<span class="badge badge-green">Al dia</span>'
                    : '<span class="badge badge-red">Pendiente</span>'}
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openEditModal(${c.id})">Editar</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div></div>';
    container.innerHTML = html;
}
