# Resumen del Sistema de Gestión — Cuerpo de Bomberos de Ibarra

## ¿Qué es este sistema?

Aplicación web desarrollada para el Cuerpo de Bomberos de Ibarra que permite
gestionar el personal operativo, administrativo y del ECU-911. Reemplaza el
proceso manual en Excel por una plataforma digital accesible desde cualquier
navegador en la red institucional.

---

## Tecnologías utilizadas

| Capa | Tecnología | Por qué se eligió |
|---|---|---|
| Frontend | React + Vite | Moderno, rápido, gran ecosistema |
| UI | Material UI | Componentes profesionales listos |
| Backend | Node.js + Express | Liviano, fácil de mantener |
| Base de datos | PostgreSQL | Robusto, gratuito, confiable |
| ORM | Prisma | Consultas seguras y tipadas |
| Auth | JWT | Estándar de autenticación web |
| PDF | Puppeteer | Genera PDFs de alta calidad |
| Excel | XLSX + FileSaver | Exportación nativa sin dependencias externas |
| Drag & Drop | DnD Kit | Librería moderna y accesible |

---

## Módulos del sistema

### 1. Autenticación y usuarios
- Login con correo institucional (@bomberosibarra.gob.ec)
- Registro público con validación de cédula contra el registro de personal
- Aprobación de nuevos usuarios por el administrador
- Máximo 150 usuarios registrados
- Cambio de contraseña desde el perfil personal

### 2. Gestión de personal
- Registro de 163+ bomberos con cédula, rango y grupo
- Tipos de personal: Operativo, ECU, Administrativo
- Marcado de personal paramédico (fondo rosa en distributivo y calendario)
- Activar / desactivar personal
- Historial automático de estaciones con duración acumulada

### 3. Turnos automáticos
- **Operativo:** 3 grupos rotativos de 24 horas (Grupo 1, 2, 3)
  - Referencia: 6 de abril 2026 = Grupo 1
  - Rotación automática A→B→C→A→B→C
- **ECU-911:** 4 grupos con turnos de 7h-14h, 14h-21h, 21h-7h
  - Referencia: 7 de abril 2026 = ECU 4 en turno 14h-21h
  - Jornada ordinaria para personal de horario fijo

### 4. Distributivo mensual
- Drag & drop para asignar personal a las 8 estaciones
- Carga automática desde el mes anterior si no hay distributivo nuevo
- Personal en vacaciones aparece bloqueado automáticamente
- Colores por tiempo consecutivo en la misma estación:
  - 🟢 Verde — 1 mes
  - 🔵 Azul — 2 meses
  - 🟠 Naranja — 3 meses
  - 🔴 Rojo — más de 3 meses (rotación urgente)
- Exportación a PDF y Excel

### 5. Calendario
- Vista mensual interactiva
- Al hacer clic en un día muestra:
  - Grupo operativo de turno
  - Personal por estación con disponibilidad
  - Ausentes con motivo y color
  - Reemplazos del día en morado
  - Turnos ECU por grupo
- Leyenda de ausencias y tiempo en estación

### 6. Ausencias y permisos
- Tipos: Vacaciones, Enfermedad, Permiso, Falta, Atraso
- Permiso con tipo específico, hora inicio y hora fin
- Personal en vacaciones bloqueado en el distributivo
- Registro histórico completo por empleado

### 7. Méritos y deméritos
- Registro de méritos (capacitaciones, reconocimientos)
- Registro de deméritos (faltas de conducta, incumplimientos)
- Historial completo por empleado

### 8. Reemplazos
- Registro de reemplazo con fecha, empleado original y suplente
- Visible en el calendario del día con fondo morado
- Historial para RRHH con exportación a Excel

### 9. Notificaciones
- Campana en la barra superior con contador de no leídas
- Sonido al recibir nueva notificación
- Niveles de urgencia: Normal, Urgente, Emergencia
- Destinatarios: todos, por grupo, ECU, administrativos
- Registro de quién leyó y a qué hora
- Solo ADMIN y OPERADOR pueden enviar

### 10. Reportes RRHH
- Reporte de ausencias por período y tipo
- Historial de estaciones por empleado
- Méritos y deméritos con filtros
- Resumen completo por empleado
- Exportación a PDF y Excel en todos los reportes

### 11. Gestión de usuarios
- Crear, editar y desactivar usuarios
- Cambio de rol directo desde la tabla
- Panel de aprobación de nuevos registros
- Indicador de capacidad (X/150 usuarios)

---

## Roles y accesos

### ADMIN
Acceso completo a todo el sistema.
- Crear y aprobar usuarios
- Cambiar roles
- Gestionar estaciones
- Enviar notificaciones
- Ver todos los reportes

### OPERADOR
- Editar distributivo mensual
- Registrar reemplazos
- Ver y gestionar personal
- Enviar notificaciones
- Ver reportes

### EVALUADOR
- Registrar ausencias y permisos
- Registrar méritos y deméritos
- Ver personal y reportes
- No puede editar distributivo

### VISUALIZADOR
- Ver calendario y distributivo
- Ver su perfil personal
- Recibir notificaciones
- Sin acceso a reportes ni gestión

---

## Estaciones del sistema

El sistema gestiona 8 estaciones operativas más la Central ECU-911:
- Estación X1, X2, X3, X4 (Compañías primera fila)
- Estación X5, X6, X7, X8 (Compañías segunda fila)
- Central ECU — 911 (con 4 grupos rotativos + jornada ordinaria)

---

## Credenciales iniciales

| Usuario | Correo | Contraseña | Rol |
|---|---|---|---|
| Administrador | admin@bomberosibarra.gob.ec | admin123 | ADMIN |

> Cambiar la contraseña del administrador después del primer ingreso.

---

## Proceso de registro para nuevos usuarios

1. El bombero accede al sistema y hace clic en **"¿No tienes cuenta? Solicitar acceso"**
2. Ingresa su nombre, cédula (debe coincidir con el registro de personal), correo institucional y contraseña
3. El sistema valida la cédula contra el registro de empleados
4. La solicitud queda **pendiente de aprobación**
5. El administrador aprueba desde **Usuarios → Pendientes de aprobación**
6. El usuario puede ingresar con el rol **VISUALIZADOR** (el admin puede cambiar el rol)

---

## Flujo de trabajo mensual recomendado

1. **Inicio de mes** — El operador abre el Distributivo, selecciona el grupo y mes
2. El sistema carga automáticamente el distributivo del mes anterior
3. El operador ajusta el personal según necesidades (drag & drop)
4. Registra vacaciones del personal en el módulo de Personal
5. El sistema bloquea automáticamente a los que están en vacaciones
6. Guarda el distributivo — el historial de estaciones se actualiza automáticamente
7. El calendario ya refleja el nuevo distributivo al hacer clic en cualquier día

---

## Desarrollado con

- **Arquitectura:** Cliente-Servidor (REST API)
- **Base de datos:** Relacional (PostgreSQL)
- **Autenticación:** JWT con expiración de 8 horas
- **Seguridad:** Contraseñas encriptadas con bcrypt (salt 10)
- **Exportaciones:** PDF con Puppeteer, Excel con XLSX