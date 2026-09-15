@extends('layouts.app')

@section('title', 'Gestion de Trabajadores')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/user.css') }}?v={{ filemtime(public_path('css/user.css')) }}">
@endpush

@section('content')
    <nav class="app-navbar">
        <button class="nav-item active" onclick="setNav('inicio', this)">Inicio</button>
        <button class="nav-item" onclick="setNav('trabajadores', this)">Trabajadores</button>
        <button class="nav-item" onclick="setNav('importar', this)">Importar Excel</button>
        <div class="nav-dropdown">
            <button class="nav-item" onclick="toggleDropdown(event)">Alto Riesgo <span style="font-size:10px">&#9660;</span></button>
            <div class="nav-dropdown-menu">
                <div class="nav-dropdown-item" onclick="setNavAltoRiesgo('liniero')">Linieros</div>
                <div class="nav-dropdown-item" onclick="setNavAltoRiesgo('torrero')">Torreros</div>
                <div class="nav-dropdown-item" onclick="setNavAltoRiesgo('operario_cables')">Operarios de Cables</div>
                <div class="nav-dropdown-item" onclick="setNavAltoRiesgo('chofer')">Choferes</div>
                <div class="nav-dropdown-item" onclick="setNavAltoRiesgo('operador_grua')">Operadores de Grua</div>
            </div>
        </div>
        <button class="nav-item" onclick="setNav('graficos', this)">Graficos</button>
        <button class="nav-item" onclick="setNav('donantes', this)">Donantes de Sangre</button>
        <button class="nav-item" onclick="setNav('maternidad', this)">Maternidad</button>
        <a href="/manual" target="_blank" class="nav-item">Manual</a>
        <div class="nav-dropdown" style="margin-left:auto">
            <button class="nav-item" onclick="toggleDropdown(event)">Exportar <span style="font-size:10px">&#9660;</span></button>
            <div class="nav-dropdown-menu" style="left:auto;right:0">
                <a class="nav-dropdown-item" href="/api/export/pdf/trabajadores" target="_blank">PDF Trabajadores</a>
                <a class="nav-dropdown-item" href="/api/export/excel/trabajadores" target="_blank">Excel Trabajadores</a>
                <a class="nav-dropdown-item" href="/api/export/pdf/donantes" target="_blank">PDF Donantes</a>
            </div>
        </div>
    </nav>

    <div class="content-layout">
        <aside class="app-aside">
            <div class="aside-header">
                <span>&#9776;</span> Unidades Organizativas
            </div>
            <div id="asideUOsSearch" style="padding:8px 14px">
                <input type="text" id="uoSearchInput" class="form-control" placeholder="Buscar unidad..."
                    oninput="filterUOs()" style="font-size:12px;padding:5px 8px">
            </div>
            <div id="asideUOsList">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        </aside>

        <main class="app-main" id="mainContent">

            <div id="section-inicio">
                <div class="section-title">Panel de Inicio</div>
                <div class="stats-grid" id="quickStats">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
                <div id="alertasVencimiento" style="margin-bottom:16px"></div>
                <div style="margin-top:20px;padding:20px;border:1px solid var(--gray-light);border-radius:var(--radius)">
                    <h3 style="color:var(--blue);margin-bottom:10px">Sistema de Gestion de Salud Laboral</h3>
                    <p style="color:var(--black);font-size:13px;line-height:1.8">
                        Plataforma para el seguimiento y control de la salud de los trabajadores.
                        Gestion de trabajadores, donaciones de sangre, alto riesgo y estadisticas.
                    </p>
                </div>
            </div>

            <div id="section-trabajadores" class="hidden">
                <div id="trabajadoresContent">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>

            <div id="section-importar" class="hidden">
                <div class="section-title">Importar desde Excel</div>
                <div class="alert alert-info" style="margin-bottom:16px">
                    El archivo Excel debe contener las columnas: <strong>Numero de personal, Nombre, Primer apellido, Segundo Apellido, Carne Identidad, Edad, Sexo, Unidad Organizativa, Posicion</strong>.
                    El sistema detectara automaticamente el Alto Riesgo segun la posicion.
                </div>
                <div id="importAuthPrompt" style="border:2px dashed var(--blue);border-radius:var(--radius);padding:40px 30px;text-align:center;margin-bottom:20px">
                    <div style="font-size:40px;margin-bottom:12px">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                    </div>
                    <p style="color:var(--blue);font-weight:700;font-size:16px;margin-bottom:6px">Acceso Restringido</p>
                    <p style="color:var(--gray);font-size:13px;margin-bottom:16px">Debe autenticarse como Especialista Principal para importar datos.</p>
                    <button class="btn btn-primary" onclick="showImportLoginModal()">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/></svg>
                        Autenticarse
                    </button>
                </div>
                <div id="importFileSection" style="display:none">
                    <div style="border:2px dashed var(--blue);border-radius:var(--radius);padding:30px;text-align:center;margin-bottom:20px">
                        <div style="font-size:36px;margin-bottom:10px">
                            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM7 13h10v2H7v-2zm0 4h10v2H7v-2z"/></svg>
                        </div>
                        <p style="color:var(--blue);font-weight:700;margin-bottom:10px">Seleccionar archivo Excel (.xlsx, .xls, .csv)</p>
                        <input type="file" id="excelFileInput" accept=".xlsx,.xls,.csv" style="display:none" onchange="previewExcel(this)">
                        <button class="btn btn-primary" onclick="document.getElementById('excelFileInput').click()">Seleccionar Archivo</button>
                    </div>
                </div>
                <div id="importPreview" style="display:none">
                    <div class="section-title" style="font-size:14px">Vista previa de importacion</div>
                    <div id="importStats" style="margin-bottom:12px"></div>
                    <div class="import-actions" style="margin-bottom:10px;display:flex;gap:10px;align-items:center">
                        <button class="btn btn-primary" onclick="confirmImport()">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                            Confirmar Importacion
                        </button>
                        <button class="btn btn-secondary" onclick="cancelImport()">Cancelar</button>
                        <span id="importProgress" style="font-size:12px;color:var(--gray);display:none"></span>
                    </div>
                    <div class="table-wrapper" id="importTableWrapper"></div>
                </div>
                <div id="importResult" style="display:none"></div>
            </div>

            <div id="section-altoriesgo" class="hidden">
                <div id="altoRiesgoContent">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>

            <div id="section-graficos" class="hidden">
                <div id="graficosContent">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>

            <div id="section-donantes" class="hidden">
                <div id="donantesContent">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>

            <div id="section-maternidad" class="hidden">
                <div id="maternidadContent">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>

        </main>
    </div>

    @include('partials.inactivity_modal')

    <!-- Import Login Modal -->
    <div class="modal-overlay" id="importLoginModal">
        <div class="modal" style="max-width:400px">
            <div class="modal-header">
                <span class="modal-title">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/></svg>
                    Acceso a Importacion
                </span>
                <button class="btn-close" onclick="closeModal('importLoginModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom:16px;color:var(--gray)">Para importar datos debe identificarse como <strong>Especialista Principal</strong>.</p>
                <div id="importLoginError" class="alert alert-error" style="display:none"></div>
                <div class="form-group">
                    <label class="form-label">Usuario</label>
                    <input type="text" id="importLoginUser" class="form-control" placeholder="Ingrese su usuario de Especialista Principal" autocomplete="off">
                </div>
                <div class="form-group">
                    <label class="form-label">Contrasena</label>
                    <input type="password" id="importLoginPass" class="form-control" placeholder="Contrasena" onkeypress="if(event.key==='Enter')verifyImportCredentials()">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('importLoginModal')">Cancelar</button>
                <button class="btn btn-primary" onclick="verifyImportCredentials()">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/></svg>
                    Verificar
                </button>
            </div>
        </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-overlay" id="editModal">
        <div class="modal" style="max-width:760px">
            <div class="modal-header">
                <span class="modal-title">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    Editar Trabajador
                </span>
                <button class="btn-close" onclick="closeEditModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div id="editFormError" class="alert alert-error" style="display:none"></div>
                <div class="alert alert-info" style="margin-bottom:14px">
                    Fecha de edicion: <strong id="editDateTime"></strong>
                    <br><small>Campos editables: <strong>Cargo</strong>, <strong>Unidad Organizativa</strong>, <strong>Enfermedades</strong>, <strong>Tipo de Sangre</strong>, <strong>Fecha de ultimo chequeo</strong>, <strong>Chequeo de Chofer</strong> y <strong>Donante de Sangre</strong>. El resto de la informacion es solo de consulta.</small>
                </div>
                <form id="editTrabajadorForm">
                    <input type="hidden" name="edit_id" id="edit_id">
                    <div style="background:var(--gray-bg);padding:16px;border-radius:var(--radius);margin-bottom:16px;border:1px solid var(--gray-light)">
                        <div style="font-weight:700;color:var(--gray);margin-bottom:10px;font-size:13px">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                            Datos del Trabajador (solo consulta)
                        </div>
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">No. Personal</label>
                                <div style="padding:7px 10px;background:var(--gray-bg);border:1px dashed var(--gray-light);border-radius:var(--radius);font-size:13px;font-family:monospace;font-weight:700;color:var(--gray)" id="edit_display_id_numerico"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nombre Completo</label>
                                <div style="padding:7px 10px;background:var(--gray-bg);border:1px dashed var(--gray-light);border-radius:var(--radius);font-size:13px;font-weight:600;color:var(--gray)" id="edit_display_nombre"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cargo</label>
                                <input type="text" name="cargo" id="edit_cargo" class="form-control" list="editCargoList" placeholder="Seleccione o escriba un cargo">
                                <datalist id="editCargoList"></datalist>
                                <small style="color:var(--gray)">Al cambiar el cargo se recalcula la clasificacion de alto riesgo segun el catalogo de posiciones.</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Unidad Organizativa</label>
                                <input type="text" name="unidad_organizativa" id="edit_unidad" class="form-control" list="editUOList" placeholder="Seleccione o escriba una unidad">
                                <datalist id="editUOList"></datalist>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fecha de Nacimiento</label>
                                <div style="padding:7px 10px;background:var(--gray-bg);border:1px dashed var(--gray-light);border-radius:var(--radius);font-size:13px;color:var(--gray)" id="edit_display_fecha_nac"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Sexo</label>
                                <div style="padding:7px 10px;background:var(--gray-bg);border:1px dashed var(--gray-light);border-radius:var(--radius);font-size:13px;color:var(--gray)" id="edit_display_sexo"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Division</label>
                                <div style="padding:7px 10px;background:var(--gray-bg);border:1px dashed var(--gray-light);border-radius:var(--radius);font-size:13px;color:var(--gray)" id="edit_display_division"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Alto Riesgo</label>
                                <div style="padding:7px 10px;background:var(--gray-bg);border:1px dashed var(--gray-light);border-radius:var(--radius);font-size:13px;color:var(--gray)" id="edit_display_altoriesgo"></div>
                            </div>
                        </div>
                    </div>
                    <div style="background:#fefce8;padding:16px;border-radius:var(--radius);margin-bottom:16px;border:1px solid #fde68a">
                        <div style="font-weight:700;color:var(--warning);margin-bottom:10px;font-size:13px">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            Campos Editables
                        </div>
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Tipo de Sangre</label>
                                <select name="tipo_sangre" class="form-control">
                                    <option value="">&mdash; Seleccionar &mdash;</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fecha de Ultimo Chequeo Medico</label>
                                <input type="date" name="fecha_ultimo_chequeo" class="form-control" id="edit_fecha_chequeo">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Chequeo Medico Especializado de Chofer</label>
                                <input type="date" name="fecha_chequeo_chofer" class="form-control" id="edit_fecha_chequeo_chofer">
                                <small style="color:var(--gray)">Examen psicofisico completo (vista, oido, cardiovascular, neurologico y reflejos). Vigencia: 1 ano.</small>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Donante de Sangre</label>
                            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
                                <input type="checkbox" name="es_donante" id="edit_es_donante" value="1">
                                <span>Marcar como donante de sangre</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Maternidad</label>
                            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
                                <input type="checkbox" name="embarazada" id="edit_embarazada" value="1">
                                <span>Embarazada / en periodo de maternidad</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Inicio de la Gestacion</label>
                            <input type="date" name="fecha_gestacion_inicio" id="edit_fecha_gestacion" class="form-control">
                            <small style="color:var(--gray)">Licencia automatica: inicio = gestacion + 6 meses, fin = gestacion + 18 meses.</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Enfermedades</label>
                            <div class="checkbox-group" id="edit_enfermedadesCheckboxes"></div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeEditModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="saveEditTrabajador()">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                    Guardar Cambios
                </button>
            </div>
        </div>
    </div>

    <!-- Quick View Modal -->
    <div class="modal-overlay" id="quickViewModal">
        <div class="modal" style="max-width:600px">
            <div class="modal-header">
                <span class="modal-title" id="quickViewTitle">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                    Detalle del Trabajador
                </span>
                <button class="btn-close" onclick="closeModal('quickViewModal')">&times;</button>
            </div>
            <div class="modal-body" id="quickViewBody"></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('quickViewModal')">Cerrar</button>
            </div>
        </div>
    </div>

    <!-- Float Search Modal -->
    <div class="modal-overlay" id="floatSearchModal">
        <div class="modal" style="max-width:560px">
            <div class="modal-header">
                <span class="modal-title">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                    Busqueda Rapida
                </span>
                <button class="btn-close" onclick="closeModal('floatSearchModal')">&times;</button>
            </div>
            <div class="modal-body">
                <input type="text" id="floatSearchInput" class="form-control" placeholder="Buscar por nombre o Numero de Personal..." oninput="doFloatSearch()" autofocus style="font-size:15px;padding:10px 14px;margin-bottom:14px">
                <div id="floatSearchResults"></div>
            </div>
        </div>
    </div>

    <!-- Confirm Import Modal -->
    <div class="modal-overlay" id="confirmImportModal">
        <div class="modal" style="max-width:440px">
            <div class="modal-header">
                <span class="modal-title">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    Confirmar Importacion
                </span>
                <button class="btn-close" onclick="closeModal('confirmImportModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p id="confirmImportText" style="margin-bottom:16px"></p>
                <div class="alert alert-warning" style="margin:0">Esta accion no se puede deshacer. Los registros existentes se actualizaran.</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('confirmImportModal')">Cancelar</button>
                <button class="btn btn-primary" onclick="executeImport()">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    Confirmar Importacion
                </button>
            </div>
        </div>
    </div>

    <!-- Float Search Button -->
    <button class="float-search-btn" id="floatSearchBtn" title="Busqueda rapida" aria-label="Busqueda rapida">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
    </button>
@endsection

@push('scripts')
    <script src="{{ asset('js/config.js') }}?v={{ filemtime(public_path('js/config.js')) }}"></script>
    <script src="{{ asset('js/trabajadores.js') }}?v={{ filemtime(public_path('js/trabajadores.js')) }}"></script>
    <script src="{{ asset('js/donantes.js') }}?v={{ filemtime(public_path('js/donantes.js')) }}"></script>
    <script src="{{ asset('js/graficos.js') }}?v={{ filemtime(public_path('js/graficos.js')) }}"></script>
    <script src="{{ asset('js/importar.js') }}?v={{ filemtime(public_path('js/importar.js')) }}"></script>
    <script src="{{ asset('js/choferes.js') }}?v={{ filemtime(public_path('js/choferes.js')) }}"></script>
    <script src="{{ asset('js/maternidad.js') }}?v={{ filemtime(public_path('js/maternidad.js')) }}"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var userChip = document.querySelector('.user-chip');
            var avatar = userChip ? userChip.querySelector('.user-avatar') : null;
            var nameSpan = userChip ? userChip.querySelector('span') : null;
            if (userChip && !userChip.getAttribute('data-username')) {
                userChip.setAttribute('data-username', nameSpan ? nameSpan.textContent.trim() : '');
            }
            loadDivisiones();
            setNav('inicio', document.querySelector('.nav-item'));
        });
    </script>
@endpush
