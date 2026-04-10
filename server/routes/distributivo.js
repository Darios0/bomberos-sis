const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/distributivo/personal/:grupo/:mes/:anio
router.get('/personal/:grupo/:mes/:anio', async (req, res) => {
  try {
    const { grupo, mes, anio } = req.params
    const esEcu = grupo === 'ECU'

    const wherePersonal = esEcu
      ? { tipoPersonal: 'ECU', activo: true }
      : {
          OR: [
            { tipoPersonal: 'OPERATIVO', grupoOperativo: grupo },
            { tipoPersonal: 'ADMINISTRATIVO' }
          ],
          activo: true
        }

    const personal = await prisma.empleado.findMany({
      where: wherePersonal,
      include: {
        estacion: { select: { id: true, nombre: true } },
        ausencias: {
          where: {
            fechaInicio: { lte: new Date(`${anio}-${String(mes).padStart(2,'0')}-28`) },
            fechaFin:    { gte: new Date(`${anio}-${String(mes).padStart(2,'0')}-01`) }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    const distributivo = await prisma.distributivo.findFirst({
      where: {
        mes:   parseInt(mes),
        anio:  parseInt(anio),
        grupo: esEcu ? null : grupo,
        esEcu
      },
      include: {
        items: {
          orderBy: { orden: 'asc' },
          include: { empleado: true, estacion: true }
        }
      }
    })

    res.json({ personal, distributivo })
  } catch (error) {
    console.error('Error en /personal:', error)
    res.status(500).json({ error: 'Error al obtener personal' })
  }
})

// GET /api/distributivo/:grupo/:mes/:anio
router.get('/:grupo/:mes/:anio', async (req, res) => {
  try {
    const { grupo, mes, anio } = req.params
    const esEcu = grupo === 'ECU'

    const distributivo = await prisma.distributivo.findFirst({
      where: {
        mes:   parseInt(mes),
        anio:  parseInt(anio),
        grupo: esEcu ? null : grupo,
        esEcu
      },
      include: {
        items: {
          orderBy: { orden: 'asc' },
          include: { empleado: true, estacion: true }
        }
      }
    })
    res.json(distributivo || null)
  } catch (error) {
    console.error('Error en /:grupo/:mes/:anio:', error)
    res.status(500).json({ error: 'Error al obtener distributivo' })
  }
})

// POST /api/distributivo/guardar
router.post('/guardar', async (req, res) => {
  const { grupo, mes, anio, items } = req.body
  if (!mes || !anio || !items) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  try {
    const esEcu     = grupo === 'ECU'
    const mesInt    = parseInt(mes)
    const anioInt   = parseInt(anio)

    // Primer día y último día del mes
    const fechaInicio = new Date(`${anioInt}-${String(mesInt).padStart(2,'0')}-01`)
    const ultimoDia   = new Date(anioInt, mesInt, 0).getDate()
    const fechaFin    = new Date(`${anioInt}-${String(mesInt).padStart(2,'0')}-${ultimoDia}`)

    // Buscar o crear distributivo
    let distributivo = await prisma.distributivo.findFirst({
      where: { mes: mesInt, anio: anioInt, grupo: esEcu ? null : grupo, esEcu }
    })

    if (!distributivo) {
      distributivo = await prisma.distributivo.create({
        data: { mes: mesInt, anio: anioInt, grupo: esEcu ? null : grupo, esEcu }
      })
    }

    // Eliminar items anteriores
    await prisma.distributivoItem.deleteMany({
      where: { distributivoId: distributivo.id }
    })

    // Crear nuevos items
    if (items.length > 0) {
      await prisma.distributivoItem.createMany({
        data: items.map((item, idx) => ({
          distributivoId: distributivo.id,
          empleadoId:     item.empleadoId,
          estacionId:     item.estacionId  || null,
          esEcu:          item.esEcu       || false,
          esAdmin:        item.esAdmin     || false,
          esJornadaEcu:   item.esJornadaEcu || false,
          orden:          idx
        }))
      })
    }

  // ── Historial automático ───────────────────────────────────────
const itemsConEstacion = items.filter(i => i.estacionId)

for (const item of itemsConEstacion) {
  const empId = item.empleadoId
  const estId = item.estacionId

  // Buscar si ya existe historial para este empleado en este mes y año exacto
  const historialExistente = await prisma.historialEstacion.findFirst({
    where: {
      empleadoId:  empId,
      estacionId:  estId,
      fechaInicio: fechaInicio,
      fechaFin:    fechaFin
    }
  })

  // Si ya existe exactamente este registro, no hacer nada
  if (historialExistente) continue

  // Verificar si hay un historial del mes anterior en la misma estación
  const mesAnterior  = mesInt === 1 ? 12 : mesInt - 1
  const anioAnterior = mesInt === 1 ? anioInt - 1 : anioInt
  const ultimoDiaMesAnterior = new Date(anioAnterior, mesAnterior, 0).getDate()
  const finMesAnterior = new Date(`${anioAnterior}-${String(mesAnterior).padStart(2,'0')}-${ultimoDiaMesAnterior}`)
  const iniMesAnterior = new Date(`${anioAnterior}-${String(mesAnterior).padStart(2,'0')}-01`)

  const historialContinuo = await prisma.historialEstacion.findFirst({
    where: {
      empleadoId:  empId,
      estacionId:  estId,
      fechaInicio: iniMesAnterior,
      fechaFin:    finMesAnterior
    }
  })

  if (historialContinuo) {
    // Extender el historial hasta el fin de este mes
    await prisma.historialEstacion.update({
      where: { id: historialContinuo.id },
      data:  { fechaFin }
    })
  } else {
    // Cerrar historial abierto anterior si lo hay
    await prisma.historialEstacion.updateMany({
      where: { empleadoId: empId, fechaFin: null },
      data:  { fechaFin: new Date(fechaInicio.getTime() - 86400000) }
    })
    // Crear nuevo registro
    await prisma.historialEstacion.create({
      data: { empleadoId: empId, estacionId: estId, fechaInicio, fechaFin }
    })
  }
}

// Limpiar historial duplicado — dejar solo un registro por empleado+estación+mes
// Esto corrige registros duplicados previos
const todosLosHistoriales = await prisma.historialEstacion.findMany({
  where: {
    fechaInicio: fechaInicio,
    fechaFin:    fechaFin
  },
  orderBy: { id: 'asc' }
})

const vistos = new Set()
for (const h of todosLosHistoriales) {
  const clave = `${h.empleadoId}-${h.estacionId}`
  if (vistos.has(clave)) {
    await prisma.historialEstacion.delete({ where: { id: h.id } })
  } else {
    vistos.add(clave)
  }
}

res.json({ mensaje: 'Distributivo guardado y historial actualizado' })
  } catch (error) {
    console.error('Error en /guardar:', error)
    res.status(500).json({ error: 'Error al guardar distributivo' })
  }
})

module.exports = router