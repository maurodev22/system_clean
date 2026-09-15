// ============================================================
// donantes.js - Gestion de donantes de sangre
// Funcionalidades: CRUD de donaciones, busqueda de trabajadores,
//                  validacion de fechas (3 meses entre donaciones),
//                  estadisticas
// ============================================================

const DONANTES_API = "/api/donantes";
const TRABAJADORES_API = "/api/trabajadores";

let donantesAllData = [];
let donantesPage = 1;
let donantesPerPage = 20;

async function loadDonantes() {
  const container = document.getElementById("donantesContent");
  if (!container) return;

  container.innerHTML = `
    <div style="margin-bottom:24px">
        <div class="d-flex justify-between align-center" style="margin-bottom:16px">
            <h3 style="color:var(--blue)"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:6px"><path d="M12 2L5 12c-1.5 2-2 4-2 6 0 3.3 2.7 6 6 6 1.1 0 2.2-.3 3.1-.9.9.6 2 .9 3.1.9 3.3 0 6-2.7 6-6 0-2-1-4-2-6L12 2zM9 22c-2.2 0-4-1.8-4-4 0-1.5.8-3.2 2-4.7l5-6.7 5 6.7c1.2 1.5 2 3.2 2 4.7 0 2.2-1.8 4-4 4-1.1 0-2.2-.4-3-1.2-.8.8-1.9 1.2-3 1.2z"/></svg> Donantes de Sangre</h3>
            <div class="d-flex gap-2">
                <a href="/api/export/pdf/donantes" target="_blank" class="btn btn-secondary btn-sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg> Exportar PDF</a>
                <a href="/api/export/excel/donantes" target="_blank" class="btn btn-secondary btn-sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5L13 3.5zM8 13l2.5 3.5L8 20h2l1.5-2.2L13 20h2l-2.5-3.5L15 13h-2l-1.5 2.2L10 13H8z"/></svg> Excel</a>
                <button class="btn btn-primary btn-sm" onclick="openDonacionModal()">Registrar Donacion</button>
            </div>
        </div>
        <div class="grid-4" id="donanteStats" style="margin-bottom:20px">
            <div class="loading"><div class="spinner"></div></div>
        </div>
    </div>
    <div id="donanteTabla"><div class="loading"><div class="spinner"></div></div></div>

    <!-- Modal editar donacion -->
    <div class="modal-overlay" id="editDonacionModal">
        <div class="modal" style="max-width:500px">
            <div class="modal-header">
                <span class="modal-title"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle;margin-right:6px"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Editar Donacion</span>
                <button class="btn-close" onclick="closeModal('editDonacionModal')"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></button>
            </div>
            <div class="modal-body">
                <div id="editDonacionError" class="alert alert-error" style="display:none"></div>
                <input type="hidden" id="editDonacionId">
                <div class="form-group">
                    <label class="form-label">Trabajador</label>
                    <div id="editDonacionTrabajador" style="padding:7px 10px;background:var(--gray-bg);border:1px solid var(--gray-light);border-radius:var(--radius);font-size:13px;font-weight:600"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Tipo de Sangre</label>
                    <select class="form-control" id="editDonacionTipoSangre">
                        <option value="">— Seleccionar —</option>
                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Fecha de Donacion</label>
                    <input type="date" class="form-control" id="editDonacionFecha" max="${new Date().toISOString().split("T")[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="editDonacionEstimulo" style="margin-right:6px">
                        Recibio Estimulo
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('editDonacionModal')">Cancelar</button>
                <button class="btn btn-primary" onclick="saveEditDonacion()"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Guardar Cambios</button>
            </div>
        </div>
    </div>

    <!-- Modal nueva donacion -->
    <div class="modal-overlay" id="donacionModal">
        <div class="modal" style="max-width:500px">
            <div class="modal-header">
                <span class="modal-title"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle;margin-right:6px"><path d="M12 2L5 12c-1.5 2-2 4-2 6 0 3.3 2.7 6 6 6 1.1 0 2.2-.3 3.1-.9.9.6 2 .9 3.1.9 3.3 0 6-2.7 6-6 0-2-1-4-2-6L12 2z"/></svg> Registrar Donacion</span>
                <button class="btn-close" onclick="closeModal('donacionModal')"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></button>
            </div>
            <div class="modal-body">
                <div id="donacionError" class="alert alert-error" style="display:none"></div>
                <div class="form-group">
                    <label class="form-label">Buscar Trabajador</label>
                    <input type="text" class="form-control" id="donanteBusqueda" placeholder="Nombre o ID..." oninput="buscarDonante(this.value)">
                    <div id="donanteResultados" style="margin-top:8px;max-height:150px;overflow-y:auto"></div>
                    <input type="hidden" id="donanteSeleccionado">
                    <div id="donanteSeleccionadoInfo" style="display:none" class="alert alert-info"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Tipo de Sangre</label>
                    <select class="form-control" id="donanteBS">
                        <option value="">— Seleccionar —</option>
                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Fecha de Donacion</label>
                    <input type="date" class="form-control" id="donanteFecha" max="${
                      new Date().toISOString().split("T")[0]
                    }">
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="donanteEstimulo" style="margin-right:6px">
                        Recibio Estimulo
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-control" id="donanteObs" rows="2" placeholder="Opcional..." maxlength="500"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('donacionModal')">Cancelar</button>
                <button class="btn btn-primary" onclick="guardarDonacion()">Guardar Donacion</button>
            </div>
        </div>
    </div>`;

  await Promise.all([loadDonanteStats(), loadDonanteTabla()]);
}

async function loadDonanteStats() {
  try {
    const res = await fetch(`${DONANTES_API}/stats/overview`);
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    const stats = await res.json();

    document.getElementById("donanteStats").innerHTML = `
      <div class="stat-card"><div class="stat-value" style="color:#dc2626">${stats.total_donaciones}</div><div class="stat-label">Total Donaciones</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#003087">${stats.donantes_unicos}</div><div class="stat-label">Donantes Unicos</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#059669">${stats.con_estimulo}</div><div class="stat-label">Con Estimulo</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#d97706">${stats.pueden_donar}</div><div class="stat-label">Pueden Donar Ya</div></div>`;
  } catch(e) {
    const el = document.getElementById("donanteStats");
    if (el) el.innerHTML = '<div class="alert alert-error">' + connError(DONANTES_API + '/stats/overview', e) + '</div>';
  }
}

async function loadDonanteTabla() {
  try {
    const res = await fetch(`${DONANTES_API}`);
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    const json = await res.json();
    donantesAllData = json.data || [];
    donantesPage = 1;
    renderDonantePage();
  } catch(e) {
    const container = document.getElementById("donanteTabla");
    if (container) container.innerHTML = '<div class="alert alert-error">' + connError(DONANTES_API, e) + '</div>';
  }
}

function renderDonantePage() {
  const container = document.getElementById("donanteTabla");
  if (!container) return;

  const total = donantesAllData.length;
  const totalPages = Math.max(1, Math.ceil(total / donantesPerPage));
  if (donantesPage > totalPages) donantesPage = totalPages;
  const start = (donantesPage - 1) * donantesPerPage;
  const pageData = donantesAllData.slice(start, start + donantesPerPage);

  if (!pageData.length) {
    container.innerHTML = '<div class="alert alert-info">No hay donantes registrados.</div>';
    return;
  }

  let html = `
    <div class="table-container">
    <div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>ID</th><th>Trabajador</th><th>Tipo Sangre</th><th>Fecha Donacion</th>
                <th>Proxima Donacion</th><th>Puede Donar?</th><th>Estimulo</th>
                <th>Cargo</th><th>Acciones</th>
            </tr>
        </thead>
        <tbody>`;

  pageData.forEach((d) => {
    const puede = d.puede_donar === true || d.puede_donar === "t";
    html += `
        <tr>
            <td><span class="badge badge-blue" style="font-family:monospace">${d.id_numerico}</span></td>
            <td><strong>${d.trabajador_nombre}</strong></td>
            <td><span class="badge badge-red" style="font-weight:700">${d.tipo_sangre}</span></td>
            <td>${new Date(d.fecha_donacion).toLocaleDateString("es-ES")}</td>
            <td>${new Date(d.proxima_donacion).toLocaleDateString("es-ES")}</td>
            <td>
                ${puede
                    ? '<span class="badge badge-green">Si</span>'
                    : '<span class="badge badge-gray">No aun</span>'}
            </td>
            <td>${d.recibio_estimulo === true || d.recibio_estimulo === "t"
                ? '<span class="badge badge-green">Si</span>'
                : '<span class="badge badge-gray">No</span>'}</td>
            <td><small>${d.cargo}</small></td>
            <td><button class="btn btn-secondary btn-sm" onclick="openEditDonacionModal(${d.id})" aria-label="Editar donacion de ${d.trabajador_nombre}">Editar</button>
                <button class="btn btn-primary btn-sm" onclick="openDonacionModal(${d.trabajador_id},'${d.trabajador_nombre.replace(/'/g, "\\'")}','${d.tipo_sangre}','${d.worker_ultima_fecha || d.fecha_donacion}',${d.recibio_estimulo === true || d.recibio_estimulo === "t"},${d.worker_puede_donar === true || d.worker_puede_donar === "t"})" title="Agregar nueva donacion" aria-label="Registrar nueva donacion para ${d.trabajador_nombre}">Registrar</button></td>
        </tr>`;
  });

  html += "</tbody></table></div></div>";

  if (totalPages > 1) {
    html += '<div class="pagination">' +
      '<button class="btn btn-sm btn-secondary" onclick="donantesGoPage(1)" ' + (donantesPage <= 1 ? 'disabled' : '') + '>&laquo;</button>' +
      '<button class="btn btn-sm btn-secondary" onclick="donantesGoPage(' + (donantesPage-1) + ')" ' + (donantesPage <= 1 ? 'disabled' : '') + '>&lsaquo;</button>';
    var startP = Math.max(1, donantesPage - 2);
    var endP = Math.min(totalPages, donantesPage + 2);
    for (var p = startP; p <= endP; p++) {
      html += '<button class="btn btn-sm ' + (p === donantesPage ? 'btn-primary' : 'btn-secondary') + '" onclick="donantesGoPage(' + p + ')">' + p + '</button>';
    }
    html += '<button class="btn btn-sm btn-secondary" onclick="donantesGoPage(' + (donantesPage+1) + ')" ' + (donantesPage >= totalPages ? 'disabled' : '') + '>&rsaquo;</button>' +
      '<button class="btn btn-sm btn-secondary" onclick="donantesGoPage(' + totalPages + ')" ' + (donantesPage >= totalPages ? 'disabled' : '') + '>&raquo;</button>' +
      '<span style="margin-left:10px;font-size:12px;color:var(--gray)">Pagina ' + donantesPage + ' de ' + totalPages + '</span>' +
      '<select class="form-control" style="width:auto;display:inline-block;margin-left:10px" onchange="donantesChangePerPage(this.value)">' +
      '<option value="10" ' + (donantesPerPage === 10 ? 'selected' : '') + '>10</option>' +
      '<option value="20" ' + (donantesPerPage === 20 ? 'selected' : '') + '>20</option>' +
      '<option value="50" ' + (donantesPerPage === 50 ? 'selected' : '') + '>50</option>' +
      '<option value="100" ' + (donantesPerPage === 100 ? 'selected' : '') + '>100</option>' +
      '</select></div>';
  }

  container.innerHTML = html;
}

function donantesGoPage(p) {
  donantesPage = p;
  renderDonantePage();
}

function donantesChangePerPage(val) {
  donantesPerPage = parseInt(val);
  donantesPage = 1;
  renderDonantePage();
}

let donanteSearchTimeout;
async function buscarDonante(q) {
  clearTimeout(donanteSearchTimeout);
  if (q.length < 2) {
    document.getElementById("donanteResultados").innerHTML = "";
    return;
  }
  donanteSearchTimeout = setTimeout(async () => {
    const res = await fetch(
      `${TRABAJADORES_API}/search/${encodeURIComponent(q)}`
    );
    const json = await res.json();
    const results = json.data || [];
    let html = "";
    results.slice(0, 6).forEach((t) => {
      html += `
            <div onclick="seleccionarDonante(${t.id},'${t.nombre.replace(
        /'/g,
        "\\'"
      )}','${t.id_numerico}')"
                 style="padding:8px 12px;cursor:pointer;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:4px;transition:var(--transition)"
                 onmouseover="this.style.background='#e8f0ff'" onmouseout="this.style.background='white'">
                <strong>${t.nombre}</strong> <small style="color:#6b7280">· ${
        t.id_numerico
      } · ${t.cargo}</small>
            </div>`;
    });
    document.getElementById("donanteResultados").innerHTML = html;
  }, 300);
}

function seleccionarDonante(id, nombre, idNum) {
  document.getElementById("donanteSeleccionado").value = id;
  document.getElementById("donanteResultados").innerHTML = "";
  document.getElementById("donanteBusqueda").value = nombre;
  const info = document.getElementById("donanteSeleccionadoInfo");
  info.style.display = "block";
  info.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Seleccionado: ${nombre} (ID: ${idNum})`;
  fetch(`${DONANTES_API}/check-worker/${id}`)
    .then(r => r.json())
    .then(data => {
      if (data.ultima_donacion) {
        info.innerHTML += `<div class="alert alert-warning" style="margin-top:6px;font-size:12px"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg> Este trabajador ya dono el ${new Date(data.ultima_donacion).toLocaleDateString('es-ES')}.${data.puede_donar ? '' : ' <strong>Aun no han pasado 3 meses.</strong>'}</div>`;
      }
    })
    .catch(() => {});
}

async function guardarDonacion() {
  const tid = document.getElementById("donanteSeleccionado").value;
  const bs = document.getElementById("donanteBS").value;
  const fecha = document.getElementById("donanteFecha").value;
  const estimulo = document.getElementById("donanteEstimulo").checked;
  const obs = document.getElementById("donanteObs").value.trim();

  const errDiv = document.getElementById("donacionError");

  // Validaciones
  if (!tid) {
    errDiv.textContent = "Seleccione un trabajador";
    errDiv.style.display = "block";
    return;
  }
  if (!bs) {
    errDiv.textContent = "Seleccione tipo de sangre";
    errDiv.style.display = "block";
    return;
  }
  if (!fecha) {
    errDiv.textContent = "Ingrese la fecha de donacion";
    errDiv.style.display = "block";
    return;
  }
  // Validar que la fecha no sea futura
  if (new Date(fecha) > new Date()) {
    errDiv.textContent = "La fecha de donacion no puede ser futura";
    errDiv.style.display = "block";
    return;
  }
  // Validar tipo de sangre
  const tiposValidos = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  if (tiposValidos.indexOf(bs) === -1) {
    errDiv.textContent = "Tipo de sangre no valido";
    errDiv.style.display = "block";
    return;
  }
  if (obs.length > 500) {
    errDiv.textContent = "Las observaciones no pueden exceder 500 caracteres";
    errDiv.style.display = "block";
    return;
  }

  errDiv.style.display = "none";

  var saveBtn = document.querySelector('#donacionModal .modal-footer .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

  try {
  var csrf = document.querySelector('meta[name="csrf-token"]'); var token = csrf ? csrf.content : '';
  const res = await fetch(`${DONANTES_API}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": token },
    body: JSON.stringify({
      trabajador_id: tid,
      tipo_sangre: bs,
      fecha_donacion: fecha,
      recibio_estimulo: estimulo ? "1" : "0",
      observaciones: obs,
    }),
  });
  const json = await res.json();
  if (json.success) {
    closeModal("donacionModal");
    if (typeof showToast === "function")
      showToast("Donacion registrada correctamente", "success");
    await loadDonanteTabla();
    await loadDonanteStats();
  } else {
    errDiv.textContent = json.error || "Error al guardar";
    errDiv.style.display = "block";
  }
  } catch(e) {
    errDiv.textContent = connError(DONANTES_API, e);
    errDiv.style.display = "block";
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar Donacion'; }
  }
}

function openDonacionModal(trabajador_id, nombre, tipo_sangre, ultima_fecha, recibio_estimulo, puede_donar) {
  document.getElementById("donacionError").style.display = "none";

    if (trabajador_id) {
    if (!puede_donar) {
      showToast("Este donante aun no puede donar. Deben pasar al menos 3 meses desde su ultima donacion.", "warning");
      return;
    }
    document.getElementById("donanteSeleccionado").value = trabajador_id;
    document.getElementById("donanteBusqueda").value = nombre;
    document.getElementById("donanteResultados").innerHTML = "";

    const info = document.getElementById("donanteSeleccionadoInfo");
    info.style.display = "block";
    let infoHtml = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Seleccionado: ' + nombre;
    if (ultima_fecha) {
      infoHtml += '<div style="margin-top:6px;font-size:12px;color:#6b7280">Ultima donacion: ' + new Date(ultima_fecha).toLocaleDateString("es-ES") + (recibio_estimulo ? ' · Recibio estimulo: Si' : ' · Recibio estimulo: No') + '</div>';
    }
    info.innerHTML = infoHtml;

    document.getElementById("donanteBS").value = tipo_sangre || "";
    document.getElementById("donanteFecha").value = new Date().toISOString().split("T")[0];
    document.getElementById("donanteEstimulo").checked = false;
    document.getElementById("donanteObs").value = "";
  } else {
    document.getElementById("donanteSeleccionado").value = "";
    document.getElementById("donanteBusqueda").value = "";
    document.getElementById("donanteResultados").innerHTML = "";
    document.getElementById("donanteSeleccionadoInfo").style.display = "none";
    document.getElementById("donanteFecha").value = new Date().toISOString().split("T")[0];
    document.getElementById("donanteBS").value = "";
    document.getElementById("donanteEstimulo").checked = false;
    document.getElementById("donanteObs").value = "";
  }

  document.getElementById("donacionModal").classList.add("active");
}

async function openEditDonacionModal(id) {
  document.getElementById("editDonacionError").style.display = "none";
  document.getElementById("editDonacionId").value = id;

  try {
    const res = await fetch(`${DONANTES_API}/${id}`);
    const d = await res.json();

    if (d.error) {
      showToast(d.error, "error");
      return;
    }

    document.getElementById("editDonacionTrabajador").textContent = `${d.trabajador_nombre} (${d.id_numerico})`;
    document.getElementById("editDonacionTipoSangre").value = d.tipo_sangre || "";

    const fechaInput = document.getElementById("editDonacionFecha");
    if (d.fecha_donacion) {
      const fecha = new Date(d.fecha_donacion);
      if (!isNaN(fecha.getTime())) {
        fechaInput.value = fecha.toISOString().split("T")[0];
      }
    }

    document.getElementById("editDonacionEstimulo").checked = d.recibio_estimulo === true || d.recibio_estimulo === "t";

    document.getElementById("editDonacionModal").classList.add("open");
  } catch (e) {
    showToast("Error al cargar datos de la donacion", "error");
  }
}

async function saveEditDonacion() {
  const id = document.getElementById("editDonacionId").value;
  const fecha = document.getElementById("editDonacionFecha").value;
  const tipoSangre = document.getElementById("editDonacionTipoSangre").value;
  const estimulo = document.getElementById("editDonacionEstimulo").checked;
  const errDiv = document.getElementById("editDonacionError");

  if (!fecha) {
    errDiv.textContent = "La fecha de donacion es requerida";
    errDiv.style.display = "block";
    return;
  }

  if (new Date(fecha) > new Date()) {
    errDiv.textContent = "La fecha de donacion no puede ser futura";
    errDiv.style.display = "block";
    return;
  }

  if (!tipoSangre) {
    errDiv.textContent = "Seleccione el tipo de sangre";
    errDiv.style.display = "block";
    return;
  }

  errDiv.style.display = "none";

  var saveBtn = document.querySelector('#editDonacionModal .modal-footer .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

  try {
    var csrf = document.querySelector('meta[name="csrf-token"]'); var token = csrf ? csrf.content : '';
    const res = await fetch(`${DONANTES_API}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": token },
      body: JSON.stringify({
        fecha_donacion: fecha,
        tipo_sangre: tipoSangre,
        recibio_estimulo: estimulo ? "1" : "0",
      }),
    });
    const json = await res.json();

    if (json.success) {
      closeModal("editDonacionModal");
      showToast("Donacion actualizada correctamente", "success");
      await loadDonanteTabla();
      await loadDonanteStats();
    } else {
      errDiv.textContent = json.error || "Error al guardar";
      errDiv.style.display = "block";
    }
  } catch (e) {
    errDiv.textContent = connError(DONANTES_API + '/' + id, e);
    errDiv.style.display = "block";
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar Cambios'; }
  }
}
