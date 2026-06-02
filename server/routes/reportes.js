const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/reportes/ausencias?fechaInicio=&fechaFin=&tipo=&grupo=
router.get('/ausencias', async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipo, grupo } = req.query

    const where = {}
    if (fechaInicio && fechaFin) {
      where.OR = [
        {
          fechaInicio: { gte: new Date(fechaInicio) },
          fechaFin:    { lte: new Date(fechaFin) }
        },
        {
          fechaInicio: { lte: new Date(fechaFin) },
          fechaFin:    { gte: new Date(fechaInicio) }
        }
      ]
    }
    if (tipo) where.tipo = tipo

    const empleadoWhere = {}
    if (grupo) empleadoWhere.grupoOperativo = grupo

    const ausencias = await prisma.ausencia.findMany({
      where,
      include: {
        empleado: {
          select: {
            id: true, nombre: true, rango: true,
            grupoOperativo: true, tipoPersonal: true
          }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    })

    const filtradas = grupo
      ? ausencias.filter(a => a.empleado.grupoOperativo === grupo)
      : ausencias

    res.json(filtradas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener reporte de ausencias' })
  }
})

// GET /api/reportes/historial-estaciones?empleadoId=&estacionId=
router.get('/historial-estaciones', async (req, res) => {
  try {
    const { empleadoId, estacionId } = req.query
    const where = {}
    if (empleadoId) where.empleadoId = parseInt(empleadoId)
    if (estacionId) where.estacionId = parseInt(estacionId)

    const historial = await prisma.historialEstacion.findMany({
      where,
      include: {
        empleado: { select: { id: true, nombre: true, rango: true, grupoOperativo: true } },
        estacion: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaInicio: 'desc' }
    })

    // Calcular duración en días para cada registro
    const conDuracion = historial.map(h => {
      const ini  = new Date(h.fechaInicio)
      const fin  = h.fechaFin ? new Date(h.fechaFin) : new Date()
      const dias = Math.round((fin - ini) / 86400000)
      return { ...h, dias }
    })

    res.json(conDuracion)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial' })
  }
})

// GET /api/reportes/evaluaciones?tipo=&grupo=&fechaInicio=&fechaFin=
router.get('/evaluaciones', async (req, res) => {
  try {
    const { tipo, grupo, fechaInicio, fechaFin } = req.query
    const where = {}
    if (tipo) where.tipo = tipo
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }

    const evaluaciones = await prisma.evaluacion.findMany({
      where,
      include: {
        empleado: {
          select: {
            id: true, nombre: true, rango: true,
            grupoOperativo: true, tipoPersonal: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    const filtradas = grupo
      ? evaluaciones.filter(e => e.empleado.grupoOperativo === grupo)
      : evaluaciones

    res.json(filtradas)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener evaluaciones' })
  }
})

// GET /api/reportes/resumen-empleado/:id
router.get('/resumen-empleado/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const [empleado, ausencias, evaluaciones, historial] = await Promise.all([
      prisma.empleado.findUnique({
        where: { id },
        include: { estacion: true }
      }),
      prisma.ausencia.findMany({
        where: { empleadoId: id },
        orderBy: { fechaInicio: 'desc' }
      }),
      prisma.evaluacion.findMany({
        where: { empleadoId: id },
        orderBy: { fecha: 'desc' }
      }),
      prisma.historialEstacion.findMany({
        where: { empleadoId: id },
        include: { estacion: true },
        orderBy: { fechaInicio: 'desc' }
      })
    ])

    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' })

    const resumen = {
      empleado,
      totalAusencias:   ausencias.length,
      totalVacaciones:  ausencias.filter(a => a.tipo === 'VACACIONES').length,
      totalEnfermedades: ausencias.filter(a => a.tipo === 'ENFERMEDAD').length,
      totalPermisos:    ausencias.filter(a => a.tipo === 'PERMISO').length,
      totalFaltas:      ausencias.filter(a => a.tipo === 'FALTA').length,
      totalAtrasos:     ausencias.filter(a => a.tipo === 'ATRASO').length,
      totalMeritos:     evaluaciones.filter(e => e.tipo === 'MERITO').length,
      totalDemeritos:   evaluaciones.filter(e => e.tipo === 'DEMERITO').length,
      ausencias,
      evaluaciones,
      historial: historial.map(h => ({
        ...h,
        dias: Math.round((
          (h.fechaFin ? new Date(h.fechaFin) : new Date()) - new Date(h.fechaInicio)
        ) / 86400000)
      }))
    }

    res.json(resumen)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' })
  }
})

module.exports = router