const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/ausencias/empleado/:id
router.get('/empleado/:id', async (req, res) => {
  try {
    const ausencias = await prisma.ausencia.findMany({
      where:   { empleadoId: parseInt(req.params.id) },
      orderBy: { fechaInicio: 'desc' }
    })
    res.json(ausencias)
  } catch {
    res.status(500).json({ error: 'Error al obtener ausencias' })
  }
})

// POST /api/ausencias
router.post('/', async (req, res) => {
  const {
    empleadoId, tipo, fechaInicio, fechaFin,
    horaInicio, horaFin, descripcion, tipoPermiso
  } = req.body

  if (!empleadoId || !tipo || !fechaInicio || !fechaFin) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  try {
    const ausencia = await prisma.ausencia.create({
      data: {
        empleadoId:  parseInt(empleadoId),
        tipo, fechaInicio: new Date(fechaInicio),
        fechaFin:    new Date(fechaFin),
        horaInicio:  horaInicio  || null,
        horaFin:     horaFin     || null,
        descripcion: descripcion || null,
        tipoPermiso: tipoPermiso || null
      }
    })
    res.status(201).json(ausencia)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar ausencia' })
  }
})

// DELETE /api/ausencias/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.ausencia.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ mensaje: 'Ausencia eliminada' })
  } catch {
    res.status(500).json({ error: 'Error al eliminar ausencia' })
  }
})

module.exports = router