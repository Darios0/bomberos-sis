const prisma = require('./prisma/client')

async function main() {
  const grupos = [
    { nombre: 'MATPEL',     color: '#ff5722', descripcion: 'Materiales Peligrosos' },
    { nombre: 'EBREM',      color: '#9c27b0', descripcion: 'Emergencias en Espacios Confinados' },
    { nombre: 'GOT',        color: '#2196f3', descripcion: 'Grupo Operativo Táctico' },
    { nombre: 'BRIF',       color: '#4caf50', descripcion: 'Brigada de Incendios Forestales' },
    { nombre: 'R-ACUATICO', color: '#00bcd4', descripcion: 'Rescate Acuático' },
    { nombre: 'RESCATE',    color: '#ff9800', descripcion: 'Rescate General' },
    { nombre: 'BUZO',       color: '#1565c0', descripcion: 'Buceo' },
  ]

  for (const grupo of grupos) {
    const existe = await prisma.grupoEspecializado.findUnique({
      where: { nombre: grupo.nombre }
    })
    if (!existe) {
      await prisma.grupoEspecializado.create({ data: grupo })
      console.log(`Creado: ${grupo.nombre}`)
    } else {
      console.log(`Ya existe: ${grupo.nombre}`)
    }
  }

  console.log('Grupos especializados listos')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())