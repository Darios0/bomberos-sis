const express = require('express')
const prisma  = require('../prisma/client')
const {
  getGrupoOperativoPorFecha,
  getResumenEcuPorFecha
} = require('../utils/turnos')
const router = express.Router()

router.get('/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params
    const fechaDate = new Date(fecha + 'T00:00:00.000Z')

    const grupoOperativo = getGrupoOperativoPorFecha(fechaDate)
    const resumenEcu     = getResumenEcuPorFecha(fechaDate)

    // Buscar distributivo del mes para esa fecha
    const mes  = fechaDate.getUTCMonth() + 1
    const anio = fechaDate.getUTCFullYear()

    const distributivo = await prisma.distributivo.findFirst({
      where: { mes, anio, grupo: grupoOperativo, esEcu: false },
      include: {
        items: {
          orderBy: { orden: 'asc' },
          include: {
            empleado: true,
            estacion: true
          }
        }
      }
    })

    const distributivoEcu = await prisma.distributivo.findFirst({
      where: { mes, anio, esEcu: true },
      include: {
        items: {
          orderBy: { orden: 'asc' },
          include: { empleado: true }
        }
      }
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

    const idsAusentes = new Set(ausencias.map(a => a.empleadoId))

// Reemplazos del día
const reemplazos = await prisma.reemplazo.findMany({
  where: { fecha: fechaDate },
  include: {
    empleadoOriginal:  { select: { id: true, nombre: true, rango: true } },
    empleadoReemplazo: { select: { id: true, nombre: true, rango: true } },
    estacion:          { select: { id: true, nombre: true } }
  }
})

// Map de reemplazos por empleado original
const mapaReemplazos = {}
reemplazos.forEach(r => {
  mapaReemplazos[r.empleadoOriginalId] = r
})    

    // Agrupar por estación desde el distributivo
    const estaciones = await prisma.estacion.findMany({
      orderBy: { id: 'asc' }
    })

    const porEstacion = estaciones.map(est => {
      const itemsEst = distributivo?.items?.filter(i => i.estacionId === est.id) || []
    const operativos = itemsEst
  .filter(i => !i.esAdmin)
  .map(i => ({
    ...i.empleado,
    ausente:      idsAusentes.has(i.empleado.id),
    ausenciaInfo: ausencias.find(a => a.empleadoId === i.empleado.id) || null,
    reemplazo:    mapaReemplazos[i.empleado.id] || null
  }))
const administrativos = itemsEst
  .filter(i => i.esAdmin)
  .map(i => ({
    ...i.empleado,
    ausente:      idsAusentes.has(i.empleado.id),
    ausenciaInfo: ausencias.find(a => a.empleadoId === i.empleado.id) || null,
    reemplazo:    mapaReemplazos[i.empleado.id] || null
  }))
      return {
        id:             est.id,
        nombre:         est.nombre,
        operativos,
        administrativos,
        total:          operativos.length + administrativos.length
      }
    })

    // ECU
    const personalEcu = distributivoEcu?.items?.map(i => ({
      ...i.empleado,
      esJornadaEcu: i.esJornadaEcu,
      ausente:      idsAusentes.has(i.empleado.id),
      ausenciaInfo: ausencias.find(a => a.empleadoId === i.empleado.id) || null
    })) || []

    // Operativos administrativos (sin estación asignada en el distributivo)
    const operativosAdmin = distributivo?.items
      ?.filter(i => i.esAdmin && !i.estacionId)
      ?.map(i => ({
        ...i.empleado,
        ausente:      idsAusentes.has(i.empleado.id),
        ausenciaInfo: ausencias.find(a => a.empleadoId === i.empleado.id) || null
      })) || []

    res.json({
      fecha,
      grupoOperativo,
      resumenEcu,
      porEstacion,
      personalEcu,
      operativosAdmin,
      ausencias,
      reemplazos,
      totalAusentes:     idsAusentes.size,
      distributivoExiste: !!distributivo
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener calendario' })
  }
})

module.exports = router