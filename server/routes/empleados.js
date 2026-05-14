const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

router.get('/', async (req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({
      orderBy: { nombre: 'asc' },
      include: { estacion: { select: { id: true, nombre: true } } }
    })
    res.json(empleados)
  } catch {
    res.status(500).json({ error: 'Error al obtener empleados' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const empleado = await prisma.empleado.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: {
        estacion:           true,
        ausencias:          true,
        evaluaciones:       true,
        historialEstaciones: { include: { estacion: true } }
      }
    })
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json(empleado)
  } catch {
    res.status(500).json({ error: 'Error al obtener empleado' })
  }
})



router.post('/', async (req, res) => {
 const { nombre, cedula, rango, tipoPersonal, grupoOperativo, grupoEcu, estacionId, esParamedico, antiguedad } = req.body
  if (!nombre || !cedula || !rango || !tipoPersonal) {
    return res.status(400).json({ error: 'Nombre, cédula, rango y tipo son requeridos' })
  }
  try {
    const empleado = await prisma.empleado.create({
      data: {
        nombre, cedula, rango, tipoPersonal,
        grupoOperativo: grupoOperativo || null,
        grupoEcu:       grupoEcu       || null,
        estacionId:     estacionId     || null,
        esParamedico:   esParamedico   || false,
        antiguedad: antiguedad ? parseInt(antiguedad) : 99
      }
    })
    res.status(201).json(empleado)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'La cédula ya está registrada' })
    }
    res.status(500).json({ error: 'Error al crear empleado' })
  }
})

router.put('/:id', async (req, res) => {
  const { nombre, cedula, rango, tipoPersonal, grupoOperativo, grupoEcu, estacionId, activo, esParamedico, antiguedad } = req.body
  try {
    const empleado = await prisma.empleado.update({
      where: { id: parseInt(req.params.id) },
      data:  {
        nombre, cedula, rango, tipoPersonal, activo,
        grupoOperativo: grupoOperativo || null,
        grupoEcu:       grupoEcu       || null,
        estacionId:     estacionId     || null,
        esParamedico:   esParamedico ?? false,
        antiguedad: antiguedad ? parseInt(antiguedad) : 99
      }
    })
    res.json(empleado)
  } catch {
    res.status(500).json({ error: 'Error al actualizar empleado' })
  }
})

router.put('/:id', async (req, res) => {
  console.log('PUT body completo:', req.body)
  const { nombre, cedula, rango, tipoPersonal, grupoOperativo, grupoEcu, estacionId, activo, esParamedico, antiguedad } = req.body
  console.log('antiguedad recibida:', antiguedad)

})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.empleado.update({
      where: { id: parseInt(req.params.id) },
      data:  { activo: false }
    })
    res.json({ mensaje: 'Empleado desactivado correctamente' })
  } catch {
    res.status(500).json({ error: 'Error al desactivar empleado' })
  }
})


module.exports = router