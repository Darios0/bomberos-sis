const express = require('express')
const prisma  = require('../prisma/client')
const router  = express.Router()

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
          include: {
            empleado: true,
            estacion: true
          }
        }
      }
    })
    res.json(distributivo || null)
  } catch (error) {
    console.error(error)
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
    const esEcu = grupo === 'ECU'

    // Buscar o crear distributivo
    let distributivo = await prisma.distributivo.findFirst({
      where: {
        mes: parseInt(mes), anio: parseInt(anio),
        grupo: esEcu ? null : grupo, esEcu
      }
    })

    if (!distributivo) {
      distributivo = await prisma.distributivo.create({
        data: {
          mes: parseInt(mes), anio: parseInt(anio),
          grupo: esEcu ? null : grupo, esEcu
        }
      })
    }

    // Eliminar items anteriores y recrear
    await prisma.distributivoItem.deleteMany({
      where: { distributivoId: distributivo.id }
    })

    await prisma.distributivoItem.createMany({
      data: items.map((item, idx) => ({
        distributivoId: distributivo.id,
        empleadoId:     item.empleadoId,
        estacionId:     item.estacionId || null,
        esEcu:          item.esEcu      || false,
        esAdmin:        item.esAdmin    || false,
        orden:          idx
      }))
    })

    res.json({ mensaje: 'Distributivo guardado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al guardar distributivo' })
  }
})

module.exports = router