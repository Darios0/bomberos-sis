const VALOR_RANGO = {
  'Bombero':         0,
  'Cabo':            10,
  'Sargento':        20,
  'Suboficial':      30,
  'Subteniente':     50,
  'Teniente':        60,
  'Capitán':         70,
  'Mayor':           80,
  'Teniente Coronel':90,
  'Coronel':         100,
  'Otro':            0
}

const MAX_ANTIGUEDAD = 50

/**
 * Calcula el puntaje de un empleado
 * Mayor rango = mayor puntaje
 * Menor número de antigüedad = mayor puntaje (más antiguo)
 * Puntaje = valorRango + (MAX_ANTIGUEDAD - antiguedad)
 */
function calcularPuntaje(empleado) {
  const valorRango   = VALOR_RANGO[empleado.rango] || 0
  const antiguedad   = empleado.antiguedad || 99
  return valorRango * 10 + (MAX_ANTIGUEDAD - antiguedad)
}

/**
 * Determina el oficial de control de una lista de empleados
 * Solo considera los que están en Estación X1 y no están ausentes
 * @param {Array} personalEstacionX1 - empleados asignados a X1
 * @param {Set} idsAusentes - ids de empleados ausentes hoy
 * @returns {Object|null} empleado oficial de control
 */
function determinarOficialControl(personalEstacionX1, idsAusentes = new Set()) {
  if (!personalEstacionX1 || personalEstacionX1.length === 0) return null

  // Filtrar ausentes
  const disponibles = personalEstacionX1.filter(emp =>
    !idsAusentes.has(emp.id || emp.empleadoId)
  )

  if (disponibles.length === 0) return null

  // Ordenar por puntaje descendente
  const ordenados = disponibles.sort((a, b) =>
    calcularPuntaje(b) - calcularPuntaje(a)
  )

  const oficial = ordenados[0]
  const puntaje = calcularPuntaje(oficial)
  const valorRango = VALOR_RANGO[oficial.rango] || 0
  const antiInv    = MAX_ANTIGUEDAD - (oficial.antiguedad || 99)

  return {
    ...oficial,
    puntaje,
    puntajeTexto: `${valorRango}.${antiInv}`,
    esOficialControl: true
  }
}

module.exports = { calcularPuntaje, determinarOficialControl, VALOR_RANGO }