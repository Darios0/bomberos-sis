const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

// GET /api/grupos-especializados
router.get('/', async (req, res) => {
  try {
    const grupos = await prisma.grupoEspecializado.findMany({
      orderBy: { nombre: 'asc' }
    })
    res.json(grupos)
  } catch {
    res.status(500).json({ error: 'Error al obtener grupos' })
  }
})

// POST /api/grupos-especializados
router.post('/', async (req, res) => {
  const { nombre, color, descripcion } = req.body
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' })
  try {
    const grupo = await prisma.grupoEspecializado.create({
      data: { nombre, color: color || '#607d8b', descripcion }
    })
    res.status(201).json(grupo)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un grupo con ese nombre' })
    }
    res.status(500).json({ error: 'Error al crear grupo' })
  }
})

// PUT /api/grupos-especializados/:id
router.put('/:id', async (req, res) => {
  const { nombre, color, descripcion } = req.body
  try {
    const grupo = await prisma.grupoEspecializado.update({
      where: { id: parseInt(req.params.id) },
      data:  { nombre, color, descripcion }
    })
    res.json(grupo)
  } catch {
    res.status(500).json({ error: 'Error al actualizar grupo' })
  }
})



// DELETE /api/grupos-especializados/quitar
router.delete('/quitar', async (req, res) => {
  const { empleadoId, grupoEspecializadoId } = req.body
  try {
    await prisma.empleadoGrupoEspecializado.deleteMany({
      where: {
        empleadoId:           parseInt(empleadoId),
        grupoEspecializadoId: parseInt(grupoEspecializadoId)
      }
    })
    res.json({ mensaje: 'Grupo removido del empleado' })
  } catch {
    res.status(500).json({ error: 'Error al remover grupo' })
  }
})




// DELETE /api/grupos-especializados/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.grupoEspecializado.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ mensaje: 'Grupo eliminado' })
  } catch {
    res.status(500).json({ error: 'Error al eliminar grupo' })
  }
})

// POST /api/grupos-especializados/asignar
router.post('/asignar', async (req, res) => {
  const { empleadoId, grupoEspecializadoId } = req.body
  try {
    const asignacion = await prisma.empleadoGrupoEspecializado.create({
      data: {
        empleadoId:          parseInt(empleadoId),
        grupoEspecializadoId: parseInt(grupoEspecializadoId)
      }
    })
    res.status(201).json(asignacion)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El empleado ya pertenece a este grupo' })
    }
    res.status(500).json({ error: 'Error al asignar grupo' })
  }
})



// GET /api/grupos-especializados/empleado/:id
router.get('/empleado/:id', async (req, res) => {
  try {
    const grupos = await prisma.empleadoGrupoEspecializado.findMany({
      where:   { empleadoId: parseInt(req.params.id) },
      include: { grupoEspecializado: true }
    })
    res.json(grupos.map(g => g.grupoEspecializado))
  } catch {
    res.status(500).json({ error: 'Error al obtener grupos del empleado' })
  }
})

module.exports = router