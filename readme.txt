# Sistema de Gestión de Turnos — Bomberos

Sistema web para gestión de personal, turnos, estaciones, ausencias y evaluaciones del cuerpo de bomberos.

---

## Requisitos previos

Instalar antes de clonar el proyecto:

| Herramienta | Versión | Descarga |
|---|---|---|
| Node.js | 20.x LTS o superior | https://nodejs.org |
| PostgreSQL | 18.x | https://www.postgresql.org/download |
| Git | Cualquier versión reciente | https://git-scm.com |

---

## Clonar el proyecto

```bash
git clone https://github.com/TU_USUARIO/bomberos-sistema.git
cd bomberos-sistema
```

---

## Configuración del Backend

### 1. Instalar dependencias

```bash
cd server
npm install
```

### 2. Crear el archivo de variables de entorno

Crea el archivo `server/.env` con este contenido:

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/bomberos_db"
JWT_SECRET="clave_secreta_bomberos_2024"
PORT=3001
```

Reemplaza `TU_CONTRASEÑA` con la contraseña de tu PostgreSQL local.

### 3. Crear la base de datos

Abre pgAdmin o una terminal con psql y ejecuta:

```sql
CREATE DATABASE bomberos_db;
```

### 4. Aplicar el schema de la base de datos

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Crear el usuario administrador inicial

```bash
node seed.js
```

Credenciales por defecto:
- Email: `admin@bomberos.com`
- Contraseña: `admin123`

> Cambia la contraseña después del primer ingreso.

### 6. Levantar el servidor

```bash
node index.js
```

El servidor corre en `http://localhost:3001`

---

## Configuración del Frontend

### 1. Instalar dependencias

```bash
cd client
npm install
```

### 2. Levantar el frontend

```bash
npm run dev
```

El frontend corre en `http://localhost:5173`

---

## Dependencias del proyecto

### Backend — `server/`

| Paquete | Versión | Para qué se usa |
|---|---|---|
| express | 4.x | Servidor web y rutas API |
| prisma | 6.x | ORM para manejar la base de datos |
| @prisma/client | 6.x | Cliente de Prisma para consultas |
| bcryptjs | — | Encriptar contraseñas |
| jsonwebtoken | — | Autenticación con tokens JWT |
| cors | — | Permitir peticiones desde el frontend |
| dotenv | — | Leer variables de entorno del .env |
| nodemon | — | Reinicio automático en desarrollo |

### Frontend — `client/`

| Paquete | Versión | Para qué se usa |
|---|---|---|
| react | 18.x | Librería principal de UI |
| vite | 5.x | Empaquetador y servidor de desarrollo |
| axios | — | Peticiones HTTP al backend |
| @mui/material | 5.x | Componentes de interfaz (Material UI) |
| @emotion/react | — | Requerido por MUI para estilos |
| @emotion/styled | — | Requerido por MUI para estilos |
| @mui/icons-material | — | Íconos de Material UI |
| @fullcalendar/react | — | Componente de calendario interactivo |
| @fullcalendar/daygrid | — | Vista mensual del calendario |
| @fullcalendar/interaction | — | Clicks e interacciones en el calendario |

---

## Estructura del proyecto