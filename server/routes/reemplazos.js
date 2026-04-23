const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/reemplazos?fecha=&mes=&anio=
router.get('/', async (req, res) => {
  try {
    const { fecha, mes, anio } = req.query
    const where = {}

    if (fecha) {
      where.fecha = new Date(fecha + 'T00:00:00.000Z')
    } else if (mes && anio) {
      const inicio = new Date(`${anio}-${String(mes).padStart(2,'0')}-01T00:00:00.000Z`)
      const fin    = new Date(parseInt(anio), parseInt(mes), 0)
      fin.setHours(23, 59, 59)
      where.fecha = { gte: inicio, lte: fin }
    }

    const reemplazos = await prisma.reemplazo.findMany({
      where,
      include: {
        empleadoOriginal:  { select: { id: true, nombre: true, rango: true, grupoOperativo: true } },
        empleadoReemplazo: { select: { id: true, nombre: true, rango: true, grupoOperativo: true } },
        estacion:          { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'asc' }
    })
    res.json(reemplazos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener reemplazos' })
  }
})

// POST /api/reemplazos
router.post('/', async (req, res) => {
  const {
    fecha, empleadoOriginalId, empleadoReemplazoId,
    estacionId, grupoEcu, esEcu, motivo, creadoPor
  } = req.body

  if (!fecha || !empleadoOriginalId || !empleadoReemplazoId) {
    return res.status(400).json({ error: 'Fecha y empleados son requeridos' })
  }
  if (empleadoOriginalId === empleadoReemplazoId) {
    return res.status(400).json({ error: 'El empleado original y el reemplazo no pueden ser el mismo' })
  }

  try {
    // Verificar que no hay reemplazo duplicado para ese día
    const existe = await prisma.reemplazo.findFirst({
      where: {
        fecha:             new Date(fecha + 'T00:00:00.000Z'),
        empleadoOriginalId: parseInt(empleadoOriginalId)
      }
    })
    if (existe) {
      return res.status(400).json({
        error: 'Ya existe un reemplazo registrado para este empleado en esa fecha'
      })
    }

    const reemplazo = await prisma.reemplazo.create({
      data: {
        fecha:              new Date(fecha + 'T00:00:00.000Z'),
        empleadoOriginalId:  parseInt(empleadoOriginalId),
        empleadoReemplazoId: parseInt(empleadoReemplazoId),
        estacionId:         estacionId  ? parseInt(estacionId)  : null,
        grupoEcu:           grupoEcu    || null,
        esEcu:              esEcu       || false,
        motivo:             motivo      || null,
        creadoPor:          parseInt(creadoPor)
      },
      include: {
        empleadoOriginal:  { select: { id: true, nombre: true, rango: true } },
        empleadoReemplazo: { select: { id: true, nombre: true, rango: true } },
        estacion:          { select: { id: true, nombre: true } }
      }
    })
    res.status(201).json(reemplazo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear reemplazo' })
  }
})

// DELETE /api/reemplazos/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.reemplazo.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ mensaje: 'Reemplazo eliminado' })
  } catch {
    res.status(500).json({ error: 'Error al eliminar reemplazo' })
  }
})

module.exports = router