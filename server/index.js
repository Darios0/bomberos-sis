const express          = require('express')
const cors             = require('cors')
const bcrypt           = require('bcryptjs')
const jwt              = require('jsonwebtoken')
const prisma           = require('./prisma/client')
const turnosRoutes     = require('./routes/turnos')
const empleadosRoutes  = require('./routes/empleados')
const estacionesRoutes = require('./routes/estaciones')
const calendarioRoutes = require('./routes/calendario')
const ausenciasRoutes  = require('./routes/ausencias')
const evaluacionesRoutes = require('./routes/evaluaciones')
const distributivoRoutes = require('./routes/distributivo')
const historialRoutes = require('./routes/historial')
const notificacionesRoutes = require('./routes/notificaciones')
const usuariosRoutes = require('./routes/usuarios')
const pdfRoutes = require('./routes/pdf')
const reportesRoutes = require('./routes/reportes')
const reemplazosRoutes = require('./routes/reemplazos')
const dashboardRoutes = require('./routes/dashboard')

require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/notificaciones', notificacionesRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/pdf', pdfRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/reemplazos', reemplazosRoutes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Servidor funcionando correctamente' })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' })
    if (!usuario.aprobado) return res.status(401).json({ error: 'Tu cuenta está pendiente de aprobación por el administrador' })
if (!usuario.activo)   return res.status(401).json({ error: 'Usuario inactivo' })
    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' })
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error en el servidor' })
  }
})

app.use('/api/turnos',      turnosRoutes)
app.use('/api/empleados',   empleadosRoutes)
app.use('/api/estaciones',  estacionesRoutes)
app.use('/api/calendario',  calendarioRoutes)
app.use('/api/ausencias',   ausenciasRoutes)
app.use('/api/evaluaciones', evaluacionesRoutes)
app.use('/api/distributivo', distributivoRoutes)
app.use('/api/historial', historialRoutes)
app.use('/api/dashboard', dashboardRoutes)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})