const express = require('express')
const bcrypt  = require('bcryptjs')
const prisma  = require('../prisma/client')
const router  = express.Router()

const DOMINIO_PERMITIDO = '@bomberosibarra.gob.ec'
const MAX_USUARIOS      = 150

// GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true, nombre: true, email: true,
        rol: true, activo: true, aprobado: true, creadoEn: true
      }
    })
    res.json(usuarios)
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// GET /api/usuarios/pendientes — para el admin
router.get('/pendientes', async (req, res) => {
  try {
    const pendientes = await prisma.usuario.findMany({
      where:   { aprobado: false },
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true, nombre: true, email: true,
        rol: true, activo: true, aprobado: true, creadoEn: true
      }
    })
    res.json(pendientes)
  } catch {
    res.status(500).json({ error: 'Error al obtener pendientes' })
  }
})

// POST /api/usuarios/registro — auto-registro público
router.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }

  if (!email.endsWith(DOMINIO_PERMITIDO)) {
    return res.status(400).json({
      error: `Solo se permiten correos institucionales (${DOMINIO_PERMITIDO})`
    })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  try {
    const total = await prisma.usuario.count()
    if (total >= MAX_USUARIOS) {
      return res.status(400).json({ error: 'Se alcanzó el límite máximo de usuarios del sistema' })
    }

    const hash    = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hash,
        rol:      'VISUALIZADOR',
        activo:   false,
        aprobado: false
      },
      select: { id: true, nombre: true, email: true, rol: true }
    })
    res.status(201).json({
      usuario,
      mensaje: 'Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.'
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo ya está registrado' })
    }
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

// POST /api/usuarios — crear desde admin (aprobado automáticamente)
router.post('/registro', async (req, res) => {
  const { nombre, email, password, cedula } = req.body

  if (!nombre || !email || !password || !cedula) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }

  if (!email.endsWith(DOMINIO_PERMITIDO)) {
    return res.status(400).json({
      error: `Solo se permiten correos institucionales (${DOMINIO_PERMITIDO})`
    })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  // Validar formato de cédula — 10 dígitos numéricos
  if (!/^\d{10}$/.test(cedula)) {
    return res.status(400).json({ error: 'La cédula debe tener exactamente 10 dígitos numéricos' })
  }

  try {
    // Verificar que la cédula existe en el registro de empleados
    const empleado = await prisma.empleado.findUnique({
      where: { cedula }
    })

    if (!empleado) {
      return res.status(400).json({
        error: 'La cédula no está registrada en el sistema de personal. Contacta al administrador.'
      })
    }

    if (!empleado.activo) {
      return res.status(400).json({
        error: 'El empleado asociado a esta cédula está inactivo. Contacta al administrador.'
      })
    }

    // Verificar que esa cédula no tenga ya un usuario registrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { cedula }
    })

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Ya existe una cuenta registrada con esta cédula.'
      })
    }

    const total = await prisma.usuario.count()
    if (total >= MAX_USUARIOS) {
      return res.status(400).json({ error: 'Se alcanzó el límite máximo de usuarios del sistema' })
    }

    const hash    = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hash,
        cedula,
        rol:      'VISUALIZADOR',
        activo:   false,
        aprobado: false
      },
      select: { id: true, nombre: true, email: true, rol: true }
    })

    res.status(201).json({
      usuario,
      empleado: { nombre: empleado.nombre, rango: empleado.rango },
      mensaje: 'Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.'
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo o cédula ya está registrado' })
    }
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

// PUT /api/usuarios/:id — editar
router.put('/:id', async (req, res) => {
  const { nombre, email, rol, activo, aprobado, password } = req.body
  try {
    const data = {}
    if (nombre   !== undefined) data.nombre   = nombre
    if (email    !== undefined) data.email     = email
    if (rol      !== undefined) data.rol       = rol
    if (activo   !== undefined) data.activo    = activo
    if (aprobado !== undefined) data.aprobado  = aprobado
    if (password) data.password = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: { id: true, nombre: true, email: true, rol: true, activo: true, aprobado: true }
    })
    res.json(usuario)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo ya está registrado' })
    }
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

// POST /api/usuarios/:id/aprobar
router.post('/:id/aprobar', async (req, res) => {
  try {
    await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data:  { aprobado: true, activo: true }
    })
    res.json({ mensaje: 'Usuario aprobado correctamente' })
  } catch {
    res.status(500).json({ error: 'Error al aprobar usuario' })
  }
})

// POST /api/usuarios/:id/rechazar
router.post('/:id/rechazar', async (req, res) => {
  try {
    await prisma.usuario.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ mensaje: 'Solicitud rechazada y eliminada' })
  } catch {
    res.status(500).json({ error: 'Error al rechazar usuario' })
  }
})

module.exports = router