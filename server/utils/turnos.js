// ─── OPERATIVOS (Grupos 1, 2, 3) ───────────────────────────────────────────
// Referencia: 6 abril 2026 = GRUPO_1
const REF_OPERATIVO = new Date('2026-04-06T00:00:00.000Z')
const GRUPOS_OPERATIVOS = ['GRUPO_1', 'GRUPO_2', 'GRUPO_3']

function getGrupoOperativoPorFecha(fecha) {
  const f = new Date(fecha)
  f.setUTCHours(0, 0, 0, 0)
  const ref = new Date(REF_OPERATIVO)
  ref.setUTCHours(0, 0, 0, 0)
  const diffDias = Math.round((f - ref) / 86400000)
  const indice   = ((diffDias % 3) + 3) % 3
  return GRUPOS_OPERATIVOS[indice]
}

// ─── ECU (Grupos 1, 2, 3, 4) ───────────────────────────────────────────────
// Ciclo de 4 días por grupo:
//   Día 0: 14h00–21h00
//   Día 1: 07h00–14h00 y 21h00–07h00
//   Día 2: Libre
//   Día 3: Libre
// Referencia: 7 abril 2026 = ECU_4 está en Día 0 (14h-21h)
const REF_ECU = new Date('2026-04-07T00:00:00.000Z')

// Desfase de cada grupo respecto a la referencia
// ECU_4 = día 0, ECU_3 = día 1, ECU_2 = día 2 (libre), ECU_1 = día 3 (libre)
const DESFASE_ECU = {
  ECU_1: 3,
  ECU_2: 2,
  ECU_3: 1,
  ECU_4: 0,
}

const TURNOS_ECU = [
  { dia: 0, turnos: ['14h00-21h00'] },
  { dia: 1, turnos: ['07h00-14h00', '21h00-07h00'] },
  { dia: 2, turnos: [] }, // Libre
  { dia: 3, turnos: [] }, // Libre
]

function getTurnosEcuPorFechaYGrupo(fecha, grupo) {
  const f = new Date(fecha)
  f.setUTCHours(0, 0, 0, 0)
  const ref = new Date(REF_ECU)
  ref.setUTCHours(0, 0, 0, 0)
  const diffDias  = Math.round((f - ref) / 86400000)
  const desfase   = DESFASE_ECU[grupo]
  const diaEnCiclo = ((diffDias - desfase) % 4 + 4) % 4
  return TURNOS_ECU.find(t => t.dia === diaEnCiclo)?.turnos || []
}

function getResumenEcuPorFecha(fecha) {
  const grupos = ['ECU_1', 'ECU_2', 'ECU_3', 'ECU_4']
  const resumen = {}
  grupos.forEach(g => {
    const turnos = getTurnosEcuPorFechaYGrupo(fecha, g)
    resumen[g] = turnos.length > 0 ? turnos : ['Libre']
  })
  return resumen
}

function getProximosTurnos(dias = 30) {
  const resultado = []
  const hoy = new Date()
  hoy.setUTCHours(0, 0, 0, 0)
  for (let i = 0; i < dias; i++) {
    const fecha = new Date(hoy)
    fecha.setUTCDate(hoy.getUTCDate() + i)
    const fechaStr = fecha.toISOString().split('T')[0]
    resultado.push({
      fecha: fechaStr,
      operativo: getGrupoOperativoPorFecha(fecha),
      ecu: getResumenEcuPorFecha(fecha)
    })
  }
  return resultado
}

module.exports = {
  getGrupoOperativoPorFecha,
  getTurnosEcuPorFechaYGrupo,
  getResumenEcuPorFecha,
  getProximosTurnos
}