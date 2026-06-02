const express = require('express')
const {
  getGrupoOperativoPorFecha,
  getResumenEcuPorFecha,
  getProximosTurnos
} = require('../utils/turnos')
const router = express.Router()

// GET /api/turnos/fecha/:fecha
router.get('/fecha/:fecha', (req, res) => {
  try {
    const { fecha } = req.params
    res.json({
      fecha,
      operativo: getGrupoOperativoPorFecha(fecha),
      ecu:       getResumenEcuPorFecha(fecha)
    })
  } catch {
    res.status(400).json({ error: 'Fecha inválida' })
  }
})

// GET /api/turnos/proximos?dias=30
router.get('/proximos', (req, res) => {
  const dias = parseInt(req.query.dias) || 30
  res.json(getProximosTurnos(dias))
})

module.exports = router