const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/empleados - listar todos
router.get('/', async (req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({
      orderBy: { nombre: 'asc' }
    })
    res.json(empleados)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener empleados' })
  }
})

// GET /api/empleados/:id - obtener uno
router.get('/:id', async (req, res) => {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        ausencias:    true,
        evaluaciones: true,
        historialEstaciones: { include: { estacion: true } }
      }
    })
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json(empleado)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener empleado' })
  }
})

// POST /api/empleados - crear
router.post('/', async (req, res) => {
  const { nombre, cedula, rango, grupo } = req.body
  if (!nombre || !cedula || !rango || !grupo) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }
  try {
    const empleado = await prisma.empleado.create({
      data: { nombre, cedula, rango, grupo }
    })
    res.status(201).json(empleado)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'La cédula ya está registrada' })
    }
    res.status(500).json({ error: 'Error al crear empleado' })
  }
})

// PUT /api/empleados/:id - actualizar
router.put('/:id', async (req, res) => {
  const { nombre, cedula, rango, grupo, activo } = req.body
  try {
    const empleado = await prisma.empleado.update({
      where: { id: parseInt(req.params.id) },
      data:  { nombre, cedula, rango, grupo, activo }
    })
    res.json(empleado)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar empleado' })
  }
})

// DELETE /api/empleados/:id - desactivar (no borrar)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.empleado.update({
      where: { id: parseInt(req.params.id) },
      data:  { activo: false }
    })
    res.json({ mensaje: 'Empleado desactivado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar empleado' })
  }
})

module.exports = router