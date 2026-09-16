# SystemClean

Sistema de Gestión de Salud Ocupacional para el control de los factores humanos en recursos humanos (RRHH).

Aplicación web desarrollada con **Laravel 8** y **PostgreSQL** que centraliza la vigilancia de la salud laboral de los trabajadores: registro de trabajadores, clasificación de riesgo, control de chequeos médicos, licencias de maternidad, donantes de sangre y estadísticas gerenciales.

---

## Funcionalidades

- **Gestión de trabajadores:** CRUD completo con búsqueda, filtrado por división, unidad organizativa y categoría de riesgo.
- **Clasificación automática de riesgo:** el cargo se cruza contra un catálogo de posiciones y se clasifica automáticamente como alto riesgo (operarios de cables, choferes) con sus subcategorías.
- **Módulo de maternidad:** cálculo automático del mes de gestación y de los periodos de licencia (6–18 meses), con estados controlados (a otorgar / otorgado / a incorporación).
- **Control de chequeos médicos:** seguimiento de exámenes psicofisiológicos, chequeos especializados y chequeos de chofer, con detección automática de chequeos vencidos.
- **Módulo de donantes de sangre:** registro de donaciones con estadísticas por tipo de sangre.
- **Dashboards y estadísticas:** reportes agrupados por división, unidad organizativa, sexo, tipo de riesgo y tipo de sangre.
- **Importación masiva:** vista previa de datos, detección de duplicados y ejecución de la importación.
- **Exportación:** a Excel y PDF (FPDF).
- **Seguridad por roles:** accesos diferenciados por `especialista` y `admin`.
- **Control de concurrencia:** bloqueo de recursos con expiración (120 segundos) para evitar ediciones simultáneas.
- **Traza de auditoría:** registro de usuario, acción e IP en cada operación.
- **Seguridad de acceso:** limitador de intentos de inicio de sesión (5 intentos por minuto) y sesiones con renovación automática.

---

## Stack tecnológico

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Backend    | PHP 7.3+, Laravel 8                 |
| Base de datos | PostgreSQL                        |
| Frontend   | Blade, HTML, CSS, JavaScript (fetch/AJAX) |
| Reportes   | FPDF                                |
| Herramientas | Composer, Artisan, Git            |

---

## Requisitos

- PHP >= 7.3
- Composer
- PostgreSQL >= 11
- Extensiones PHP: `pgsql`, `pdo_pgsql`, `mbstring`, `iconv`

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/maurodev22/system_clean.git
cd system_clean

# 2. Instalar dependencias
composer install

# 3. Configurar variables de entorno
cp .env.example .env
php artisan key:generate
```

### Configurar la base de datos (`.env`)

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=system_clean
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
```

```bash
# 4. Crear las tablas
php artisan migrate

# 5. (Opcional) Cargar datos iniciales
php artisan db:seed

# 6. Iniciar el servidor
php artisan serve
```

Accede a `http://localhost:8000`.

---

## Usuarios y roles

| Rol          | Acceso                                                        |
|--------------|---------------------------------------------------------------|
| `especialista` | Dashboard de usuario, trabajadores, maternidad, donantes, importación/exportación |
| `admin`      | Todo lo anterior + gestión de usuarios y traza de auditoría      |

---

## Estructura del proyecto

```
app/
├── Http/
│   └── Controllers/
│       ├── Auth/           # Autenticación
│       ├── TrabajadorController.php   # Trabajadores, maternidad, riesgos, bloqueos
│       ├── DonanteController.php      # Donantes de sangre
│       ├── AuditoriaController.php    # Traza de auditoría
│       ├── UsuarioController.php      # Gestión de usuarios
│       ├── ExportController.php       # Exportación a Excel/PDF
│       └── ImportController.php       # Importación masiva
├── Models/                 # Eloquent models
└── routes/web.php          # Definición de rutas y autorización
```

---

## Contribuciones

Sugerencias y reportes de errores son bienvenidos. Abre un *issue* en el repositorio.

## Licencia

MIT