const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/evaluaciones/empleado/:id
router.get('/empleado/:id', async (req, res) => {
  try {
    const evaluaciones = await prisma.evaluacion.findMany({
      where:   { empleadoId: parseInt(req.params.id) },
      orderBy: { fecha: 'desc' }
    })
    res.json(evaluaciones)
  } catch {
    res.status(500).json({ error: 'Error al obtener evaluaciones' })
  }
})

// POST /api/evaluaciones
router.post('/', async (req, res) => {
  const { empleadoId, tipo, descripcion } = req.body
  if (!empleadoId || !tipo || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  try {
    const evaluacion = await prisma.evaluacion.create({
      data: {
        empleadoId: parseInt(empleadoId),
        tipo, descripcion
      }
    })
    res.status(201).json(evaluacion)
  } catch {
    res.status(500).json({ error: 'Error al registrar evaluación' })
  }
})

// DELETE /api/evaluaciones/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.evaluacion.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ mensaje: 'Evaluación eliminada' })
  } catch {
    res.status(500).json({ error: 'Error al eliminar evaluación' })
  }
})

module.exports = router