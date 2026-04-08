const express = require('express')
const prisma  = require('../prisma/client')
const {
  getGrupoOperativoPorFecha,
  getResumenEcuPorFecha
} = require('../utils/turnos')
const router = express.Router()

// GET /api/calendario/:fecha
router.get('/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params
    const fechaDate = new Date(fecha + 'T00:00:00.000Z')

    const grupoOperativo = getGrupoOperativoPorFecha(fechaDate)
    const resumenEcu     = getResumenEcuPorFecha(fechaDate)

    // Personal operativo del grupo de turno
    const personalOperativo = await prisma.empleado.findMany({
      where: {
        tipoPersonal:   'OPERATIVO',
        grupoOperativo: grupoOperativo,
        activo:         true
      },
      include: { estacion: { select: { id: true, nombre: true } } },
      orderBy: { nombre: 'asc' }
    })

    // Personal ECU por grupo con sus turnos
    const personalEcu = await prisma.empleado.findMany({
      where: { tipoPersonal: 'ECU', activo: true },
      orderBy: { grupoEcu: 'asc' }
    })

    // Personal administrativo
    const personalAdmin = await prisma.empleado.findMany({
      where:   { tipoPersonal: 'ADMINISTRATIVO', activo: true },
      include: { estacion: { select: { id: true, nombre: true } } },
      orderBy: { nombre: 'asc' }
    })

    // Ausencias activas ese día
    const ausencias = await prisma.ausencia.findMany({
      where: {
        fechaInicio: { lte: fechaDate },
        fechaFin:    { gte: fechaDate }
      },
      include: {
        empleado: { select: { id: true, nombre: true, tipoPersonal: true } }
      }
    })

    const idsAusentes = ausencias.map(a => a.empleadoId)

    // Marcar ausentes en operativo
    const operativoConEstado = personalOperativo.map(emp => ({
      ...emp,
      ausente:     idsAusentes.includes(emp.id),
      ausenciaInfo: ausencias.find(a => a.empleadoId === emp.id) || null
    }))

    // Agrupar operativos por estación
    const porEstacion = {}
    operativoConEstado.forEach(emp => {
      const key    = emp.estacion?.nombre || 'Sin estación'
      const estId  = emp.estacion?.id     || 0
      if (!porEstacion[key]) porEstacion[key] = { estacionId: estId, nombre: key, personal: [] }
      porEstacion[key].personal.push(emp)
    })

    // ECU con estado
    const ecuConEstado = personalEcu.map(emp => ({
      ...emp,
      turnos:  resumenEcu[emp.grupoEcu] || ['Libre'],
      ausente: idsAusentes.includes(emp.id)
    }))

    // Admin con estado
    const adminConEstado = personalAdmin.map(emp => ({
      ...emp,
      ausente: idsAusentes.includes(emp.id)
    }))

    res.json({
      fecha,
      grupoOperativo,
      resumenEcu,
      porEstacion:        Object.values(porEstacion),
      personalEcu:        ecuConEstado,
      personalAdmin:      adminConEstado,
      totalAusentes:      idsAusentes.length,
      ausencias
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener calendario' })
  }
})

module.exports = router