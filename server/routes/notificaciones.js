const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// Determina si un usuario debe ver la notificación según su grupo
async function usuarioVeNotificacion(usuarioId, destinatario) {
  if (destinatario === 'TODOS') return true

  const empleado = await prisma.empleado.findFirst({
    where: { activo: true }
  })

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId }
  })

  if (!usuario) return false
  if (usuario.rol === 'ADMIN') return true

  const emp = await prisma.empleado.findFirst({
    where: { cedula: usuario.email }
  })

  if (!emp) return destinatario === 'TODOS'

  const grupo = emp.grupoOperativo
  const tipo  = emp.tipoPersonal

  switch (destinatario) {
    case 'GRUPO_1':       return grupo === 'GRUPO_1'
    case 'GRUPO_2':       return grupo === 'GRUPO_2'
    case 'GRUPO_3':       return grupo === 'GRUPO_3'
    case 'GRUPO_1_2':     return ['GRUPO_1','GRUPO_2'].includes(grupo)
    case 'GRUPO_1_3':     return ['GRUPO_1','GRUPO_3'].includes(grupo)
    case 'GRUPO_2_3':     return ['GRUPO_2','GRUPO_3'].includes(grupo)
    case 'ECU':           return tipo === 'ECU'
    case 'ADMINISTRATIVO':return tipo === 'ADMINISTRATIVO'
    case 'OPERADORES':    return tipo === 'OPERATIVO'
    default:              return true
  }
}

// GET /api/notificaciones
router.get('/', async (req, res) => {
  try {
    const usuarioId = parseInt(req.query.usuarioId)
    const notificaciones = await prisma.notificacion.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        lecturas: { where: { usuarioId } }
      }
    })
    const resultado = notificaciones.map(n => ({
      ...n,
      leida:   n.lecturas.length > 0,
      leidoEn: n.lecturas[0]?.leidoEn || null
    }))
    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener notificaciones' })
  }
})

// GET /api/notificaciones/:id/lecturas — quién leyó y quién no
router.get('/:id/lecturas', async (req, res) => {
  try {
    const notifId = parseInt(req.params.id)

    const notif = await prisma.notificacion.findUnique({
      where:   { id: notifId },
      include: { lecturas: { include: { } } }
    })
    if (!notif) return res.status(404).json({ error: 'No encontrada' })

    const todosUsuarios = await prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, email: true, rol: true }
    })

    const idsLeidos = new Set(notif.lecturas.map(l => l.usuarioId))

    const leyeron   = notif.lecturas.map(l => ({
      usuarioId: l.usuarioId,
      leidoEn:   l.leidoEn,
      usuario:   todosUsuarios.find(u => u.id === l.usuarioId)
    }))

    const noLeyeron = todosUsuarios
      .filter(u => !idsLeidos.has(u.id))
      .map(u => ({ usuarioId: u.id, usuario: u }))

    res.json({ leyeron, noLeyeron, total: todosUsuarios.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener lecturas' })
  }
})

// POST /api/notificaciones
router.post('/', async (req, res) => {
  const { titulo, mensaje, urgencia, destinatario, usuarioId } = req.body
  if (!titulo || !mensaje || !usuarioId) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  try {
    const notificacion = await prisma.notificacion.create({
      data: {
        titulo,
        mensaje,
        urgencia:     urgencia     || 'NORMAL',
        destinatario: destinatario || 'TODOS',
        creadoPor:    parseInt(usuarioId)
      }
    })
    res.status(201).json(notificacion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear notificación' })
  }
})

// POST /api/notificaciones/:id/leer
router.post('/:id/leer', async (req, res) => {
  const { usuarioId } = req.body
  try {
    const existe = await prisma.notificacionLeida.findFirst({
      where: {
        notificacionId: parseInt(req.params.id),
        usuarioId:      parseInt(usuarioId)
      }
    })
    if (!existe) {
      await prisma.notificacionLeida.create({
        data: {
          notificacionId: parseInt(req.params.id),
          usuarioId:      parseInt(usuarioId)
        }
      })
    }
    res.json({ mensaje: 'Marcada como leída' })
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar como leída' })
  }
})

// POST /api/notificaciones/leer-todas
router.post('/leer-todas', async (req, res) => {
  const { usuarioId } = req.body
  try {
    const todas = await prisma.notificacion.findMany({ select: { id: true } })
    for (const n of todas) {
      const existe = await prisma.notificacionLeida.findFirst({
        where: { notificacionId: n.id, usuarioId: parseInt(usuarioId) }
      })
      if (!existe) {
        await prisma.notificacionLeida.create({
          data: { notificacionId: n.id, usuarioId: parseInt(usuarioId) }
        })
      }
    }
    res.json({ mensaje: 'Todas marcadas como leídas' })
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar todas como leídas' })
  }
})

module.exports = router