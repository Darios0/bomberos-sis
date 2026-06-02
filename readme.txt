# Sistema de Gestión de Turnos — Cuerpo de Bomberos de Ibarra

Sistema web para gestión de personal, turnos rotativos, distributivos mensuales,
ausencias, evaluaciones, reemplazos y reportes del Cuerpo de Bomberos de Ibarra.

---

## Requisitos previos

Instalar antes de clonar el proyecto:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 20.x LTS | https://nodejs.org |
| PostgreSQL | 18.x | https://www.postgresql.org/download |
| Git | Cualquier versión | https://git-scm.com |

---

## Instalación

### 1. Clonar el repositorio

```bash
https://github.com/Darios0/bomberos-sis.git
cd bomberos-sistema
```

### 2. Configurar el backend

```bash
cd server
npm install
```

Crear el archivo `server/.env`:

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/bomberos_db"
JWT_SECRET="clave_secreta_bomberos_2024"
PORT=3001
```

### 3. Crear la base de datos

Abrir pgAdmin y ejecutar:

```sql
CREATE DATABASE bomberos_db;
```

### 4. Aplicar el schema

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Crear usuario administrador inicial

```bash
node seed.js
```

Credenciales por defecto:
- **Email:** admin@bomberosibarra.gob.ec
- **Contraseña:** admin123

> Cambiar la contraseña después del primer ingreso desde Mi perfil.

### 6. Configurar el frontend

```bash
cd ../client
npm install
```

### 7. Levantar el sistema

**Terminal 1 — Backend:**
```bash
cd server
node index.js
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

---

## Dependencias

### Backend — `server/`

| Paquete | Versión | Uso |
|---|---|---|
| express | 4.x | Servidor web y rutas API REST |
| prisma | 6.x | ORM para manejo de base de datos |
| @prisma/client | 6.x | Cliente Prisma para consultas |
| bcryptjs | — | Encriptación de contraseñas |
| jsonwebtoken | — | Autenticación con tokens JWT |
| cors | — | Permitir peticiones desde el frontend |
| dotenv | — | Variables de entorno desde .env |
| puppeteer | — | Generación de archivos PDF |
| nodemon | dev | Reinicio automático en desarrollo |

### Frontend — `client/`

| Paquete | Versión | Uso |
|---|---|---|
| react | 18.x | Librería principal de interfaz |
| vite | 5.x | Empaquetador y servidor de desarrollo |
| axios | — | Peticiones HTTP al backend |
| @mui/material | 5.x | Componentes de interfaz Material UI |
| @emotion/react | — | Requerido por MUI |
| @emotion/styled | — | Requerido por MUI |
| @mui/icons-material | — | Íconos de Material UI |
| @fullcalendar/react | — | Componente de calendario interactivo |
| @fullcalendar/daygrid | — | Vista mensual del calendario |
| @fullcalendar/interaction | — | Clicks en el calendario |
| @dnd-kit/core | — | Drag and drop para el distributivo |
| @dnd-kit/sortable | — | Ordenamiento drag and drop |
| @dnd-kit/utilities | — | Utilidades de drag and drop |
| xlsx | — | Exportación a archivos Excel |
| file-saver | — | Descarga de archivos en el navegador |

---


bomberos-sistema/
├── client/                        ← Frontend React + Vite
│   └── src/
│       ├── api/                   ← Configuración axios
│       ├── components/            ← Campana notificaciones
│       ├── context/               ← AuthContext, NotificacionesContext
│       ├── hooks/                 ← usePermisos
│       ├── pages/                 ← Pantallas del sistema
│       └── utils/                 ← colorEstacion, exportarExcel
├── server/                        ← Backend Node.js + Express
│   ├── prisma/                    ← Schema y cliente de BD
│   ├── routes/                    ← Rutas de la API
│   ├── utils/                     ← Lógica de turnos
│   ├── index.js                   ← Entrada del servidor
│   └── seed.js                    ← Crear usuario admin inicial
└── README.md

## Estructura del proyecto



---

## Roles del sistema

| Rol | Permisos |
|---|---|
| **ADMIN** | Control total — crear usuarios, aprobar accesos, gestionar todo |
| **OPERADOR** | Editar distributivo, mover personal, enviar notificaciones |
| **EVALUADOR** | Registrar ausencias, permisos, méritos y deméritos |
| **VISUALIZADOR** | Solo lectura — calendario y distributivo |

---

## Dominio de correo

Solo se permiten correos institucionales con el dominio: @bomberosibarra.gob.ec

---

## Notas importantes

- El archivo `server/.env` **nunca** se sube al repositorio.
- Cada colaborador debe crear su propio `.env` con sus credenciales locales.
- Si PostgreSQL no inicia automáticamente en Windows ejecutar:
```bash
net start postgresql-x64-18
```
- Al clonar por primera vez ejecutar `npx prisma migrate deploy` para crear las tablas.