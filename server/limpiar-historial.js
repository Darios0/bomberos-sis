const prisma = require('./prisma/client')

async function limpiar() {
  const todos = await prisma.historialEstacion.findMany({
    orderBy: { id: 'asc' }
  })

  const vistos  = new Map()
  const aEliminar = []

  for (const h of todos) {
    const clave = `${h.empleadoId}-${h.estacionId}-${h.fechaInicio.toISOString().split('T')[0]}`
    if (vistos.has(clave)) {
      aEliminar.push(h.id)
    } else {
      vistos.set(clave, h.id)
    }
  }

  if (aEliminar.length > 0) {
    await prisma.historialEstacion.deleteMany({
      where: { id: { in: aEliminar } }
    })
    console.log(`Eliminados ${aEliminar.length} registros duplicados`)
  } else {
    console.log('No hay duplicados')
  }

  await prisma.$disconnect()
}

limpiar().catch(console.error)