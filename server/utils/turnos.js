// Fecha de referencia: 6 abril 2026 = Grupo 1
const FECHA_REFERENCIA = new Date('2026-04-06T00:00:00.000Z')
const GRUPOS = ['GRUPO_1', 'GRUPO_2', 'GRUPO_3']

/**
 * Dado una fecha, retorna qué grupo está de turno
 * @param {Date|string} fecha
 * @returns {string} 'GRUPO_1' | 'GRUPO_2' | 'GRUPO_3'
 */
function getGrupoPorFecha(fecha) {
  const fechaConsulta = new Date(fecha)
  fechaConsulta.setUTCHours(0, 0, 0, 0)

  const refNormalizada = new Date(FECHA_REFERENCIA)
  refNormalizada.setUTCHours(0, 0, 0, 0)

  const diffMs   = fechaConsulta - refNormalizada
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24))

  // Manejo de días negativos (fechas anteriores a la referencia)
  const indice = ((diffDias % 3) + 3) % 3

  return GRUPOS[indice]
}

/**
 * Retorna los próximos N días con su grupo asignado
 * @param {number} dias
 * @returns {Array} [{fecha, grupo}]
 */
function getProximosTurnos(dias = 30) {
  const resultado = []
  const hoy = new Date()
  hoy.setUTCHours(0, 0, 0, 0)

  for (let i = 0; i < dias; i++) {
    const fecha = new Date(hoy)
    fecha.setUTCDate(hoy.getUTCDate() + i)
    resultado.push({
      fecha: fecha.toISOString().split('T')[0],
      grupo: getGrupoPorFecha(fecha)
    })
  }

  return resultado
}

module.exports = { getGrupoPorFecha, getProximosTurnos }