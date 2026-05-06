export function getColorTiempoEstacion(meses) {
  if (!meses || meses < 1) return null
  if (meses === 1) return {
    bg:     '#ffffff',
    border: '#4caf50',
    texto:  '#1a1a1a',
    label:  '1 mes',
    nivel:  'verde'
  }
  if (meses === 2) return {
    bg:     '#ffffff',
    border: '#0097a7',
    texto:  '#1a1a1a',
    label:  '2 meses',
    nivel:  'azul'
  }
  if (meses === 3) return {
    bg:     '#ffffff',
    border: '#ef6c00',
    texto:  '#1a1a1a',
    label:  '3 meses',
    nivel:  'naranja'
  }
  return {
    bg:     '#ffffff',
    border: '#c62828',
    texto:  '#1a1a1a',
    label:  `${meses} meses`,
    nivel:  'rojo'
  }
}

/**
 * Cuenta cuántos meses CONSECUTIVOS lleva un empleado en una estación.
 * Solo cuenta meses completos registrados en el historial.
 * Ejemplo: si tiene registros en Abril, Mayo, Junio → 3 meses consecutivos.
 */
export function calcularMesesConsecutivos(historial, estacionId) {
  if (!historial || historial.length === 0 || !estacionId) return 0

  // Filtrar registros de esta estación
  const registros = historial.filter(h => {
    const hEstId = h.estacionId ?? h.estacion?.id
    return hEstId === estacionId
  })

  if (registros.length === 0) return 0

  // Cada registro del historial representa UN mes de distributivo
  // fechaInicio = 1 del mes, fechaFin = último día del mes
  // Extraer el mes de inicio de cada registro como clave única
  const mesesUnicos = new Set()
  registros.forEach(h => {
    const ini   = new Date(h.fechaInicio)
    const clave = `${ini.getUTCFullYear()}-${String(ini.getUTCMonth() + 1).padStart(2,'0')}`
    mesesUnicos.add(clave)
  })

  if (mesesUnicos.size === 0) return 0

  // Ordenar los meses
  const listaMeses = Array.from(mesesUnicos).sort()

  // Verificar que el último mes no sea muy antiguo
  // (más de 2 meses antes del mes actual = ya no está en esta estación)
  const hoy        = new Date()
  const ultimoMes  = listaMeses[listaMeses.length - 1]
  const [uA, uM]   = ultimoMes.split('-').map(Number)
  const fechaUltimo = new Date(uA, uM - 1, 1)
  const fechaHoy    = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const diffMeses   = (fechaHoy.getFullYear() - fechaUltimo.getFullYear()) * 12
                    + (fechaHoy.getMonth()    - fechaUltimo.getMonth())

  if (diffMeses > 2) return 0

  // Contar meses consecutivos desde el más reciente hacia atrás
  let consecutivos = 1
  for (let i = listaMeses.length - 2; i >= 0; i--) {
    const [a1, m1] = listaMeses[i + 1].split('-').map(Number)
    const [a2, m2] = listaMeses[i].split('-').map(Number)
    const fecha1   = new Date(a1, m1 - 1, 1)
    const fecha2   = new Date(a2, m2 - 1, 1)
    const diff     = (fecha1.getFullYear() - fecha2.getFullYear()) * 12
                   + (fecha1.getMonth()    - fecha2.getMonth())
    if (diff === 1) {
      consecutivos++
    } else {
      break
    }
  }

  return consecutivos
}