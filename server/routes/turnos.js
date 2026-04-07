const express = require('express')
const { getGrupoPorFecha, getProximosTurnos } = require('../utils/turnos')
const router = express.Router()

// GET /api/turnos/fecha/:fecha
// Ejemplo: /api/turnos/fecha/2026-04-06
router.get('/fecha/:fecha', (req, res) => {
  try {
    const grupo = getGrupoPorFecha(req.params.fecha)
    res.json({ fecha: req.params.fecha, grupo })
  } catch (error) {
    res.status(400).json({ error: 'Fecha inválida' })
  }
})

// GET /api/turnos/proximos?dias=30
router.get('/proximos', (req, res) => {
  const dias = parseInt(req.query.dias) || 30
  res.json(getProximosTurnos(dias))
})

module.exports = router