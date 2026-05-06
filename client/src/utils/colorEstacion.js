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

export function calcularMesesConsecutivos(historial, estacionId) {
  if (!historial || historial.length === 0 || !estacionId) return 0

  const hoy = new Date()

  const registros = historial
    .filter(h => {
      const hEstId = h.estacionId ?? h.estacion?.id
      return hEstId === estacionId
    })
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))

  if (registros.length === 0) return 0

  // Verificar si el último registro es reciente (dentro de los últimos 2 meses)
  const ultimo = registros[registros.length - 1]
  const finUltimo = ultimo.fechaFin ? new Date(ultimo.fechaFin) : hoy
  const dosUltimesAntesHoy = new Date(hoy)
  dosUltimesAntesHoy.setMonth(hoy.getMonth() - 2)

  // Si el último registro terminó hace más de 2 meses, no está en esta estación
  if (finUltimo < dosUltimesAntesHoy) return 0

  // Calcular desde el inicio del primer registro consecutivo hasta hoy
  const primerRegistro = registros[0]
  const inicio = new Date(primerRegistro.fechaInicio)
  const meses  = Math.round((hoy - inicio) / (1000 * 60 * 60 * 24 * 30))

  return Math.max(1, meses)
}