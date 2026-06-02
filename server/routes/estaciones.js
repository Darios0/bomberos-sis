const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

router.get('/', async (req, res) => {
  try {
    const estaciones = await prisma.estacion.findMany({
      orderBy: { id: 'asc' }
    })
    res.json(estaciones)
  } catch {
    res.status(500).json({ error: 'Error al obtener estaciones' })
  }
})

router.post('/', async (req, res) => {
  const { nombre, direccion } = req.body
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' })
  try {
    const estacion = await prisma.estacion.create({
      data: { nombre, direccion }
    })
    res.status(201).json(estacion)
  } catch {
    res.status(500).json({ error: 'Error al crear estación' })
  }
})

router.put('/:id', async (req, res) => {
  const { nombre, direccion } = req.body
  try {
    const estacion = await prisma.estacion.update({
      where: { id: parseInt(req.params.id) },
      data:  { nombre, direccion }
    })
    res.json(estacion)
  } catch {
    res.status(500).json({ error: 'Error al actualizar estación' })
  }
})
router.delete('/:id', async (req, res) => {
  try {
    await prisma.estacion.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ mensaje: 'Estación eliminada' })
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'No se puede eliminar — hay personal o asignaciones vinculadas a esta estación'
      })
    }
    res.status(500).json({ error: 'Error al eliminar estación' })
  }
})

module.exports = router