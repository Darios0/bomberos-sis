const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const prisma   = require('../prisma/client')
const router   = express.Router()

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' })
    if (!usuario.activo) return res.status(401).json({ error: 'Usuario inactivo' })

    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' })

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    })
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' })
  }
})

module.exports = router