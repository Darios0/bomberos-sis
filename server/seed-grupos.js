const prisma = require('./prisma/client')

async function main() {
  const grupos = [
    { nombre: 'MATPEL',     color: '#64f6f9', descripcion: 'Materiales Peligrosos' },
    { nombre: 'EBREM',      color: '#84633b', descripcion: 'Equipo de Busqueda y Rescate en Montaña ' },
    { nombre: 'GOT',        color: '#060606', descripcion: 'Grupo Operativo Teconológico' },
    { nombre: 'BRIF',       color: '#7cb675', descripcion: 'Brigada de Refuerzon en Incendios Forestales' },
    { nombre: 'R-ACUATICO', color: '#2565f0', descripcion: 'Rescate Acuático' },
    { nombre: 'RESCATE',    color: '#b700ff', descripcion: 'Rescate General' },
    { nombre: 'BUZO',       color: '#002c5e', descripcion: 'Buceo' },
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