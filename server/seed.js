const bcrypt = require('bcryptjs')
const prisma = require('./prisma/client')

async function main() {
  const existe = await prisma.usuario.findUnique({
    where: { email: 'admin@bomberos.com' }
  })

  if (existe) {
    console.log('El admin ya existe')
    return
  }

  const hash = await bcrypt.hash('admin123', 10)
await prisma.usuario.create({
  data: {
    nombre:   'Administrador',
    email:    'admin@bomberosibarra.gob.ec',
    password: hash,
    rol:      'ADMIN',
    activo:   true,
    aprobado: true
  }
})

  console.log('Admin creado: admin@bomberos.com / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())