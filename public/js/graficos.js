// ============================================================
// graficos.js - Graficos y estadisticas ETECSA
// Genera 4 graficos con Chart.js desde la base de datos:
//   1. Distribucion por Sexo (dona)
//   2. Trabajadores por Division (barras)
//   3. Alto Riesgo por Tipo (pastel)
//   4. Estado de Chequeos Medicos (dona)
// ============================================================

async function loadGraficos() {
    var csrf = document.querySelector('meta[name="csrf-token"]'); var token = csrf ? csrf.content : '';
    const container = document.getElementById('graficosContent');
    if (!container) return;

    container.innerHTML = `
    <div style="margin-bottom:16px" class="d-flex justify-between align-center">
        <div><h3 style="color:var(--blue)"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:6px"><path d="M5 19h4V9H5v10zm6 0h4V5h-4v14zm6 0h4v-6h-4v6z"/></svg> Graficos y Estadisticas</h3></div>
    </div>
    <div class="chart-container" style="padding:16px;margin-bottom:16px">
        <h4 style="color:var(--blue);margin-bottom:12px;font-size:13px">Grafico Personalizado</h4>
        <div class="audit-filters" style="border:none;padding:0">
            <label>Agrupar por:</label>
            <select id="customChartField">
                <option value="sexo">Sexo</option>
                <option value="division">Division</option>
                <option value="unidad_organizativa">Unidad Organizativa</option>
                <option value="tipo_alto_riesgo">Tipo de Riesgo</option>
                <option value="tipo_sangre">Tipo de Sangre</option>
            </select>
            <label>Alto Riesgo:</label>
            <select id="customChartAR">
                <option value="">Todos</option>
                <option value="si">Solo Alto Riesgo</option>
                <option value="no">Solo Normal</option>
            </select>
            <label>Tipo de Grafico:</label>
            <select id="customChartType">
                <option value="bar">Barras</option>
                <option value="doughnut">Dona</option>
                <option value="pie">Pastel</option>
            </select>
            <button class="btn btn-primary btn-sm" onclick="generarGraficoPersonalizado()">Generar</button>
        </div>
        <div class="chart-container" style="padding:12px;margin-top:12px">
            <canvas id="chartCustom" height="280"></canvas>
        </div>
    </div>
    <div class="grid-4" style="margin-bottom:16px" id="statsCards">
        <div class="loading"><div class="spinner"></div></div>
    </div>
    <div class="grid-2" style="margin-bottom:16px">
        <div class="chart-container" style="padding:12px">
            <h4 style="color:var(--blue);margin-bottom:10px;font-size:13px">Distribucion por Sexo</h4>
            <canvas id="chartSexo" height="280"></canvas>
        </div>
        <div class="chart-container" style="padding:12px">
            <h4 style="color:var(--blue);margin-bottom:10px;font-size:13px">Trabajadores por Unidad Organizativa</h4>
            <canvas id="chartUnidadOrg" height="280"></canvas>
        </div>
    </div>
    <div class="grid-2">
        <div class="chart-container" style="padding:12px">
            <h4 style="color:var(--blue);margin-bottom:10px;font-size:13px">Alto Riesgo por Tipo</h4>
            <canvas id="chartRiesgo" height="280"></canvas>
        </div>
        <div class="chart-container" style="padding:12px">
            <h4 style="color:var(--blue);margin-bottom:10px;font-size:13px">Estado de Chequeos Medicos</h4>
            <canvas id="chartChequeos" height="280"></canvas>
        </div>
    </div>
    <div class="grid-2" style="margin-top:16px">
        <div class="chart-container" style="padding:12px">
            <h4 style="color:var(--blue);margin-bottom:10px;font-size:13px">Alto Riesgo por Unidad Organizativa</h4>
            <canvas id="chartAltoRiesgoUO" height="280"></canvas>
        </div>
        <div class="chart-container" style="padding:12px">
            <h4 style="color:var(--blue);margin-bottom:10px;font-size:13px">Proporcion de Alto Riesgo</h4>
            <canvas id="chartProporcionAR" height="280"></canvas>
        </div>
    </div>`;

    try {
        const res = await fetch('/api/trabajadores/stats/overview');
        const stats = await res.json();

        const COLORS = {
            blue: 'rgba(0,48,135,0.85)',
            lightBlue: 'rgba(24,144,255,0.8)',
            darkBlue: 'rgba(0,31,92,0.85)',
            accent: 'rgba(0,80,179,0.8)',
            pale: 'rgba(0,48,135,0.4)',
            black: 'rgba(26,26,26,0.85)',
            danger: 'rgba(220,38,38,0.8)',
            success: 'rgba(5,150,105,0.8)',
            warning: 'rgba(217,119,6,0.8)',
        };

        document.getElementById('statsCards').innerHTML = `
        <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Trabajadores</div></div>
        <div class="stat-card"><div class="stat-value">${stats.hombres}</div><div class="stat-label">Hombres</div></div>
        <div class="stat-card"><div class="stat-value">${stats.mujeres}</div><div class="stat-label">Mujeres</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--danger)">${stats.alto_riesgo}</div><div class="stat-label">Alto Riesgo</div></div>`;

        // Grafico 1: Distribucion por Sexo (dona)
        new Chart(document.getElementById('chartSexo'), {
            type: 'doughnut',
            data: {
                labels: ['Mujeres (1)', 'Hombres (2)'],
                datasets: [{ data: [stats.mujeres, stats.hombres], backgroundColor: [COLORS.blue, COLORS.lightBlue], borderWidth: 2 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
        });

        // Grafico 2: Trabajadores por Unidad Organizativa (barras)
        const uoLabels = (stats.unidades_org || []).map(d => d.nombre);
        const uoVals = (stats.unidades_org || []).map(d => parseInt(d.total));
        new Chart(document.getElementById('chartUnidadOrg'), {
            type: 'bar',
            data: {
                labels: uoLabels,
                datasets: [{ label: 'Trabajadores', data: uoVals, backgroundColor: COLORS.blue, borderRadius: 4 }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });

        // Grafico 3: Alto Riesgo por Tipo (pastel)
        const riesgoLabels = (stats.riesgo_tipos || []).map(r => r.tipo);
        const riesgoVals = (stats.riesgo_tipos || []).map(r => parseInt(r.total));
        const riesgoColors = [COLORS.danger, COLORS.warning, COLORS.accent, COLORS.pale];
        new Chart(document.getElementById('chartRiesgo'), {
            type: 'pie',
            data: {
                labels: riesgoLabels.length ? riesgoLabels : ['Sin datos'],
                datasets: [{ data: riesgoLabels.length ? riesgoVals : [0], backgroundColor: riesgoColors.slice(0, riesgoLabels.length || 1), borderWidth: 2 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
        });

        // Grafico 4: Estado de Chequeos Medicos (dona)
        const chequeos = stats.chequeos || { vigentes: 0, vencidos: 0, sin_fecha: 0 };
        new Chart(document.getElementById('chartChequeos'), {
            type: 'doughnut',
            data: {
                labels: ['Vigentes', 'Vencidos', 'Sin registro'],
                datasets: [{
                    data: [chequeos.vigentes, chequeos.vencidos, chequeos.sin_fecha],
                    backgroundColor: [COLORS.success, COLORS.danger, COLORS.pale],
                    borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
        });

        // Grafico 5: Alto Riesgo por Unidad Organizativa (barras)
        const arUOLabels = (stats.riesgo_por_uo || []).map(d => d.nombre);
        const arUOVals = (stats.riesgo_por_uo || []).map(d => parseInt(d.total));
        const noArUOVals = (stats.riesgo_por_uo || []).map(d => parseInt(d.total_trabajadores) - parseInt(d.total));
        new Chart(document.getElementById('chartAltoRiesgoUO'), {
            type: 'bar',
            data: {
                labels: arUOLabels.length ? arUOLabels : ['Sin datos'],
                datasets: [
                    { label: 'Alto Riesgo', data: arUOLabels.length ? arUOVals : [0], backgroundColor: COLORS.danger, borderRadius: 4 },
                    { label: 'Normal', data: arUOLabels.length ? noArUOVals : [0], backgroundColor: COLORS.pale, borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
                scales: { x: { stacked: true }, y: { beginAtZero: true, stacked: true, ticks: { stepSize: 1 } } }
            }
        });

        // Grafico 6: Proporcion de Alto Riesgo (dona)
        new Chart(document.getElementById('chartProporcionAR'), {
            type: 'doughnut',
            data: {
                labels: ['Alto Riesgo', 'Normal'],
                datasets: [{
                    data: [stats.alto_riesgo, stats.total - stats.alto_riesgo],
                    backgroundColor: [COLORS.danger, COLORS.lightBlue],
                    borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
        });

    } catch (e) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar los graficos: ' + e.message + '. Verifique que la base de datos tenga datos o importe un archivo Excel.</div>';
        if (typeof showToast === 'function') {
            showToast('No se pudieron cargar los graficos. Si la base de datos esta vacia, importe datos primero.', 'error');
        }
    }
}

// ============================================================
// GRAFICO PERSONALIZADO
// Agrupa trabajadores por un campo elegido por el usuario,
// con filtro opcional de alto riesgo y tipo de grafico.
// ============================================================
var _customChart = null;

async function generarGraficoPersonalizado() {
    var field = document.getElementById('customChartField').value;
    var ar = document.getElementById('customChartAR').value;
    var type = document.getElementById('customChartType').value;

    var url = '/api/trabajadores/stats/custom?field=' + encodeURIComponent(field) + '&altoriesgo=' + encodeURIComponent(ar);

    try {
        var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        var json = await res.json();
        var data = json.data || [];

        if (_customChart) _customChart.destroy();

        var canvas = document.getElementById('chartCustom');
        if (!canvas) return;

        var labels = data.map(function(d) { return d.etiqueta; });
        var values = data.map(function(d) { return d.total; });

        var COLORS = [
            'rgba(0,48,135,0.85)', 'rgba(220,38,38,0.8)', 'rgba(217,119,6,0.8)',
            'rgba(5,150,105,0.8)', 'rgba(24,144,255,0.8)', 'rgba(0,31,92,0.85)',
            'rgba(0,80,179,0.8)', 'rgba(0,48,135,0.4)', 'rgba(124,58,237,0.8)',
            'rgba(219,39,119,0.8)', 'rgba(21,128,61,0.8)', 'rgba(148,163,184,0.8)'
        ];
        var bg = labels.map(function(_, i) { return COLORS[i % COLORS.length]; });

        var opts = {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
        };

        if (type === 'bar') {
            opts.scales = { y: { beginAtZero: true, ticks: { stepSize: 1 } } };
        }

        _customChart = new Chart(canvas, {
            type: type,
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Cantidad',
                    data: labels.length ? values : [0],
                    backgroundColor: type === 'bar' ? 'rgba(0,48,135,0.85)' : bg,
                    borderRadius: 4
                }]
            },
            options: opts
        });
    } catch (e) {
        if (typeof showToast === 'function') {
            showToast('Error al generar el grafico: ' + e.message, 'error');
        }
    }
}
