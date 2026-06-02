const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/historial/empleado/:id
router.get('/empleado/:id', async (req, res) => {
  try {
    const historial = await prisma.historialEstacion.findMany({
      where:   { empleadoId: parseInt(req.params.id) },
      include: { estacion: { select: { id: true, nombre: true } } },
      orderBy: { fechaInicio: 'desc' }
    })
    res.json(historial)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener historial' })
  }
})

// GET /api/historial/estacion/:id
router.get('/estacion/:id', async (req, res) => {
  try {
    const historial = await prisma.historialEstacion.findMany({
      where:   { estacionId: parseInt(req.params.id) },
      include: { empleado: { select: { id: true, nombre: true, rango: true } } },
      orderBy: { fechaInicio: 'desc' }
    })
    res.json(historial)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial' })
  }
})

module.exports = router