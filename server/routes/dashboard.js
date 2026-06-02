const express = require('express')
const prisma  = require('../prisma/client')
const {
  getGrupoOperativoPorFecha,
  getResumenEcuPorFecha
} = require('../utils/turnos')
const router = express.Router()
const { determinarOficialControl } = require('../utils/oficialControl')

router.get('/hoy', async (req, res) => {
  try {


    // Ecuador = UTC-5
 const hoy = new Date()

const fechaStr =
  hoy.getFullYear() + '-' +
  String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
  String(hoy.getDate()).padStart(2, '0')

const fechaDate = new Date(
  hoy.getFullYear(),
  hoy.getMonth(),
  hoy.getDate()
)

const mes  = hoy.getMonth() + 1
const anio = hoy.getFullYear()

    const grupoOperativo = getGrupoOperativoPorFecha(fechaDate)
    const resumenEcu     = getResumenEcuPorFecha(fechaDate)

    // Distributivo del mes actual
    const distributivo = await prisma.distributivo.findFirst({
      where: { mes, anio, grupo: grupoOperativo, esEcu: false },
      include: {
        items: {
          orderBy: { orden: 'asc' },
          include: { empleado: true, estacion: true }
        }
      }
    })
    
    
    // Ausencias activas hoy
    const ausencias = await prisma.ausencia.findMany({
      where: {
        fechaInicio: { lte: fechaDate },
        fechaFin:    { gte: fechaDate }
      },
      include: {
        empleado: { select: { id: true, nombre: true, rango: true, tipoPersonal: true } }
      }
    })

    // Reemplazos de hoy
    const reemplazos = await prisma.reemplazo.findMany({
      where: { fecha: fechaDate },
      include: {
        empleadoOriginal:  { select: { id: true, nombre: true } },
        empleadoReemplazo: { select: { id: true, nombre: true } },
        estacion:          { select: { id: true, nombre: true } }
      }
    })

    // Notificaciones recientes no leídas (últimas 5)
    const notificaciones = await prisma.notificacion.findMany({
      orderBy: { creadoEn: 'desc' },
      take: 5
    })

    // Totales generales
    const totalEmpleados = await prisma.empleado.count({ where: { activo: true } })
    const totalEstaciones = await prisma.estacion.count()

    // Personal de turno hoy
    const idsAusentes = new Set(ausencias.map(a => a.empleadoId))
    const personalTurno = distributivo?.items || []
    const totalTurno      = personalTurno.length
    const totalDisponibles = personalTurno.filter(i => !idsAusentes.has(i.empleadoId)).length
    const totalAusentes    = ausencias.length

    // Estaciones con personal hoy
    const estaciones = await prisma.estacion.findMany({ orderBy: { id: 'asc' } })
    const porEstacion = estaciones.map(est => {
      const personal = personalTurno.filter(i => i.estacionId === est.id)
      return {
        id:     est.id,
        nombre: est.nombre,
        total:  personal.length,
        activos: personal.filter(i => !idsAusentes.has(i.empleadoId)).length
      }
    })

    // Oficial de control
const estacionX1Id = estaciones[0]?.id
const itemsX1      = personalTurno.filter(i =>
  i.estacionId === estacionX1Id && !i.esAdmin
)

// Enriquecer con datos del empleado
const idsX1 = itemsX1.map(i => i.empleadoId)
const empX1 = await prisma.empleado.findMany({
  where: { id: { in: idsX1 } }
})

const oficialControl = determinarOficialControl(empX1, idsAusentes)

    res.json({
      fecha:         fechaStr,
      grupoOperativo,
      resumenEcu,
      totalEmpleados,
      totalEstaciones,
      totalTurno,
      totalDisponibles,
      totalAusentes,
      ausencias,
      reemplazos,
      notificaciones,
      porEstacion,
      oficialControl,      // ← agregar
      distributivoExiste: !!distributivo
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener datos del dashboard' })
  }
})

module.exports = router