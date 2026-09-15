<?php
// Manual de usuario del Sistema de Gestion de Trabajadores
// Ruta: /manual (servido por routes/web.php)
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual de Usuario &mdash; Sistema de Gestion</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f6fb; color: #1a1a1a; line-height: 1.6; }
        .header { background: #003087; color: #fff; padding: 24px 0; border-bottom: 4px solid #ffcd00; }
        .header .wrap { max-width: 900px; margin: 0 auto; padding: 0 24px; }
        .header h1 { font-size: 22px; }
        .header p { font-size: 13px; opacity: .9; }
        .wrap { max-width: 900px; margin: 24px auto; padding: 0 24px; }
        .card { background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,48,135,.08); padding: 22px 26px; margin-bottom: 18px; }
        .card h2 { color: #003087; font-size: 17px; margin-bottom: 12px; border-bottom: 2px solid #e8eef7; padding-bottom: 8px; }
        .card h3 { color: #003087; font-size: 14px; margin: 14px 0 6px; }
        .card ul, .card ol { margin-left: 20px; margin-bottom: 8px; }
        .card li { margin-bottom: 4px; font-size: 13.5px; }
        .card p { font-size: 13.5px; margin-bottom: 8px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
        .b-blue { background: #e5edfb; color: #003087; }
        .b-red { background: #fdeaea; color: #b91c1c; }
        .b-green { background: #e7f7f0; color: #047857; }
        .b-yellow { background: #fdf4dd; color: #b45309; }
        table { border-collapse: collapse; width: 100%; font-size: 12.5px; margin: 10px 0; }
        th, td { border: 1px solid #d7deeb; padding: 6px 10px; text-align: left; }
        th { background: #eef3fb; color: #003087; }
        .footer { text-align: center; color: #8a93a6; font-size: 12px; padding: 20px 0 40px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="wrap">
            <h1>Manual de Usuario &mdash; Sistema de Gestion de Trabajadores</h1>
            <p>Version 1.0</p>
        </div>
    </div>

    <div class="wrap">
        <div class="card">
            <h2>1. Ingreso al Sistema</h2>
            <ol>
                <li>Acceda a la direccion del sistema en el navegador.</li>
                <li>Introduzca su <strong>usuario</strong> y <strong>contrasena</strong>.</li>
                <li>Presione <strong>Entrar</strong>. Segun su rol se muestra el panel de Especialista (operario SST) o el Panel Administrativo (admin).</li>
                <li>Si la sesion permanece inactiva mas de 5 minutos, el sistema solicita re-autenticacion para continuar.</li>
            </ol>
            <h3>Roles</h3>
            <table>
                <tr><th>Rol</th><th>Acceso</th></tr>
                <tr><td>Especialista (SST)</td><td>Inicio, Trabajadores, Importar Excel, Alto Riesgo, Graficos, Donantes, Maternidad, Exportar y Manual.</td></tr>
                <tr><td>Admin</td><td>Panel Administrativo: Auditoria, Gestion de Usuarios, exportacion de Auditoria y Manual.</td></tr>
            </table>
        </div>

        <div class="card">
            <h2>2. Panel de Inicio</h2>
            <p>Muestra las estadisticas generales: total de trabajadores, alto riesgo, chequeos vencidos y donantes de sangre. Debajo se listan los trabajadores con <strong>chequeo medico vencido</strong> (clic en el aviso para desplegar el detalle).</p>
        </div>

        <div class="card">
            <h2>3. Gestion de Trabajadores</h2>
            <p>La barra lateral izquierda permite filtrar por <strong>Unidad Organizativa</strong>. En la tabla puede:</p>
            <ul>
                <li><strong>Buscar</strong> por nombre o numero de personal con la lupa flotante (esquina inferior derecha).</li>
                <li><strong>Editar</strong>: modifica tipo de sangre, ultimo chequeo, enfermedades, estado de donante y chequeo de chofer. La edicion usa bloqueo de concurrencia (no dos usuarios a la vez).</li>
                <li><strong>Ver</strong> el detalle rapido del trabajador.</li>
                <li><strong>Exportar seleccion</strong>: marque las filas con la casilla y pulse <em>PDF/Excel seleccionados</em> para exportar solo esos registros.</li>
            </ul>
        </div>

        <div class="card">
            <h2>4. Alto Riesgo</h2>
            <p>Acceda desde el menu <strong>Alto Riesgo</strong>. Categorias:</p>
            <ul>
                <li><strong>Linieros</strong>, <strong>Torreros</strong>, <strong>Operarios de Cables</strong> y <strong>Operadores de Grua</strong>: chequeo medico anual.</li>
                <li><strong>Choferes</strong>: control de recalificacion (2 anos), examen psicofisiologico (anual) y <span class="badge b-yellow">Chequeo Chofer</span> (anual, examen psicofisico completo: vista, oido, cardiovascular, neurologico y reflejos). El estado se muestra en la columna "Chequeo Chofer": <span class="badge b-green">Vigente</span>, <span class="badge b-yellow">Proximo</span> (vence en 30 dias o menos) o <span class="badge b-red">Vencido</span>.</li>
            </ul>
        </div>

        <div class="card">
            <h2>5. Importar Excel</h2>
            <p>Autentiquese como Especialista Principal y seleccione un archivo <code>.xlsx</code>, <code>.xls</code> o <code>.csv</code> con las columnas: <em>Numero de personal, Nombre, Primer apellido, Segundo apellido, Carne de identidad, Edad, Sexo, Unidad Organizativa, Posicion</em>.</p>
            <p>El sistema detecta automaticamente el <strong>Alto Riesgo</strong> segun la posicion (liniero, torrero, operario/instalador de cable, chofer, operador de grua) y muestra una vista previa con duplicados antes de confirmar.</p>
        </div>

        <div class="card">
            <h2>6. Graficos</h2>
            <p>Muestra graficos predefinidos (sexo, unidad organizativa, riesgo, chequeos). Arriba hay un panel de <strong>Grafico personalizado</strong>: seleccione el campo a agrupar (Sexo, Division, Unidad Organizativa, Tipo de Riesgo o Tipo de Sangre), si desea filtrar solo alto riesgo y el tipo de grafico (barras, dona o pastel), luego pulse <em>Generar</em>.</p>
        </div>

        <div class="card">
            <h2>7. Maternidad</h2>
            <p>Control del periodo de gestacion y la licencia de maternidad. Para cada gestante:</p>
            <ul>
                <li>Para registrar a una embarazada: vaya a <strong>Trabajadores</strong>, pulse <strong>Editar</strong> sobre la trabajadora y marque la casilla <strong>Embarazada / en periodo de maternidad</strong>, indicando el inicio de la gestacion.</li>
                <li>Ingrese la <strong>fecha de inicio de gestacion</strong>; la gestacion dura 9 meses.</li>
                <li>La <strong>licencia de maternidad</strong> se otorga a partir del mes 6 y dura 1 ano natural (fin = inicio de gestacion + 18 meses).</li>
                <li>Estados: <span class="badge b-blue">A otorgar</span> (antes del mes 6), <span class="badge b-yellow">Otorgado</span> (licencia en vigor) y <span class="badge b-green">A incorporacion</span> (se senala desde 1 mes antes de vencer la licencia y durante el periodo de reintegro).</li>
                <li>El estado se calcula automaticamente con las fechas; puede forzarse manualmente desde el boton <strong>Editar</strong> de cada registro.</li>
            </ul>
        </div>

        <div class="card">
            <h2>8. Donantes de Sangre</h2>
            <p>Registro de donaciones, tipo de sangre y fecha de la proxima donacion (cada 3 meses).</p>
        </div>

        <div class="card">
            <h2>9. Exportacion</h2>
            <p>Desde el menu <strong>Exportar</strong> o desde las tablas puede descargar listados en <strong>PDF</strong> o <strong>Excel</strong> (compatible con Excel via HTML). En la tabla de trabajadores puede seleccionar filas especificas para exportar.</p>
        </div>

        <div class="card">
            <h2>10. Panel Administrativo</h2>
            <ul>
                <li><strong>Auditoria</strong>: registro de inicios de sesion, ediciones, bloqueos y exportaciones, con filtros por accion, usuario y fecha.</li>
                <li><strong>Usuarios</strong>: crear usuarios especialistas y editar datos. Solo el propio usuario puede cambiar su contrasena (maximo 1 vez por semana).</li>
            </ul>
        </div>

        <div class="footer">Manual generado como parte del sistema &middot; <?= date('Y') ?></div>
    </div>
</body>
</html>
