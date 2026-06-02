import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Función principal de exportación
function exportarExcel(sheets, nombreArchivo) {
  const wb = XLSX.utils.book_new()

  sheets.forEach(({ nombre, datos, columnas }) => {
    // Crear encabezados
    const encabezados = columnas.map(c => c.label)
    const filas = datos.map(fila =>
      columnas.map(c => {
        const valor = c.key.split('.').reduce((obj, key) => obj?.[key], fila)
        if (c.formato === 'fecha' && valor) {
          return new Date(valor).toLocaleDateString('es-EC')
        }
        return valor ?? '—'
      })
    )

    const ws = XLSX.utils.aoa_to_sheet([encabezados, ...filas])

    // Estilo de ancho de columnas
    ws['!cols'] = columnas.map(c => ({ wch: c.ancho || 20 }))

    XLSX.utils.book_append_sheet(wb, ws, nombre)
  })

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(
    new Blob([buf], { type: 'application/octet-stream' }),
    `${nombreArchivo}.xlsx`
  )
}

// ── Exportaciones específicas ──────────────────────────────────

export function exportarAusencias(datos, filtros = {}) {
  const nombreArchivo = `Ausencias_${filtros.fechaInicio || ''}_${filtros.fechaFin || ''}`
  exportarExcel([{
    nombre: 'Ausencias',
    datos,
    columnas: [
      { label: 'Nombre',    key: 'empleado.nombre',        ancho: 30 },
      { label: 'Rango',     key: 'empleado.rango',         ancho: 18 },
      { label: 'Grupo',     key: 'empleado.grupoOperativo', ancho: 12 },
      { label: 'Tipo',      key: 'tipo',                   ancho: 14 },
      { label: 'Desde',     key: 'fechaInicio', formato: 'fecha', ancho: 14 },
      { label: 'Hasta',     key: 'fechaFin',    formato: 'fecha', ancho: 14 },
      { label: 'Tipo permiso', key: 'tipoPermiso',         ancho: 22 },
      { label: 'Descripción',  key: 'descripcion',         ancho: 35 },
    ]
  }], nombreArchivo)
}

export function exportarHistorialEstaciones(datos) {
  exportarExcel([{
    nombre: 'Historial Estaciones',
    datos,
    columnas: [
      { label: 'Nombre',    key: 'empleado.nombre',         ancho: 30 },
      { label: 'Rango',     key: 'empleado.rango',          ancho: 18 },
      { label: 'Grupo',     key: 'empleado.grupoOperativo', ancho: 12 },
      { label: 'Estación',  key: 'estacion.nombre',         ancho: 18 },
      { label: 'Desde',     key: 'fechaInicio', formato: 'fecha', ancho: 14 },
      { label: 'Hasta',     key: 'fechaFin',    formato: 'fecha', ancho: 14 },
      { label: 'Días',      key: 'dias',                    ancho: 10 },
    ]
  }], 'Historial_Estaciones')
}

export function exportarEvaluaciones(datos) {
  exportarExcel([{
    nombre: 'Méritos y Deméritos',
    datos,
    columnas: [
      { label: 'Nombre',      key: 'empleado.nombre',         ancho: 30 },
      { label: 'Rango',       key: 'empleado.rango',          ancho: 18 },
      { label: 'Grupo',       key: 'empleado.grupoOperativo', ancho: 12 },
      { label: 'Tipo',        key: 'tipo',                    ancho: 12 },
      { label: 'Descripción', key: 'descripcion',             ancho: 40 },
      { label: 'Fecha',       key: 'fecha', formato: 'fecha', ancho: 14 },
    ]
  }], 'Meritos_Demeritos')
}

export function exportarResumenEmpleado(resumen) {
  const { empleado, ausencias, evaluaciones, historial } = resumen
  const nombreArchivo = `Resumen_${empleado.nombre.replace(/ /g, '_')}`

  exportarExcel([
    {
      nombre: 'Resumen',
      datos: [{
        nombre:        empleado.nombre,
        cedula:        empleado.cedula,
        rango:         empleado.rango,
        tipo:          empleado.tipoPersonal,
        grupo:         empleado.grupoOperativo || '—',
        estacion:      empleado.estacion?.nombre || '—',
        vacaciones:    resumen.totalVacaciones,
        enfermedades:  resumen.totalEnfermedades,
        permisos:      resumen.totalPermisos,
        faltas:        resumen.totalFaltas,
        atrasos:       resumen.totalAtrasos,
        meritos:       resumen.totalMeritos,
        demeritos:     resumen.totalDemeritos,
      }],
      columnas: [
        { label: 'Nombre',        key: 'nombre',       ancho: 30 },
        { label: 'Cédula',        key: 'cedula',       ancho: 14 },
        { label: 'Rango',         key: 'rango',        ancho: 18 },
        { label: 'Tipo personal', key: 'tipo',         ancho: 16 },
        { label: 'Grupo',         key: 'grupo',        ancho: 12 },
        { label: 'Estación',      key: 'estacion',     ancho: 18 },
        { label: 'Vacaciones',    key: 'vacaciones',   ancho: 13 },
        { label: 'Enfermedades',  key: 'enfermedades', ancho: 14 },
        { label: 'Permisos',      key: 'permisos',     ancho: 12 },
        { label: 'Faltas',        key: 'faltas',       ancho: 10 },
        { label: 'Atrasos',       key: 'atrasos',      ancho: 10 },
        { label: 'Méritos',       key: 'meritos',      ancho: 10 },
        { label: 'Deméritos',     key: 'demeritos',    ancho: 12 },
      ]
    },
    {
      nombre: 'Ausencias',
      datos: ausencias,
      columnas: [
        { label: 'Tipo',          key: 'tipo',         ancho: 14 },
        { label: 'Desde',         key: 'fechaInicio',  formato: 'fecha', ancho: 14 },
        { label: 'Hasta',         key: 'fechaFin',     formato: 'fecha', ancho: 14 },
        { label: 'Tipo permiso',  key: 'tipoPermiso',  ancho: 22 },
        { label: 'Descripción',   key: 'descripcion',  ancho: 35 },
      ]
    },
    {
      nombre: 'Méritos y Deméritos',
      datos: evaluaciones,
      columnas: [
        { label: 'Tipo',          key: 'tipo',         ancho: 12 },
        { label: 'Descripción',   key: 'descripcion',  ancho: 40 },
        { label: 'Fecha',         key: 'fecha', formato: 'fecha', ancho: 14 },
      ]
    },
    {
      nombre: 'Historial Estaciones',
      datos: historial,
      columnas: [
        { label: 'Estación',      key: 'estacion.nombre', ancho: 18 },
        { label: 'Desde',         key: 'fechaInicio', formato: 'fecha', ancho: 14 },
        { label: 'Hasta',         key: 'fechaFin',    formato: 'fecha', ancho: 14 },
        { label: 'Días',          key: 'dias',        ancho: 10 },
      ]
    }
  ], nombreArchivo)
}

export function exportarDistributivo(grupo, mes, anio, estaciones, asignaciones, zonaAdmin, zonaEcu, jornadaEcu) {
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const filas = []

  // Encabezado
  filas.push(['CUERPO DE BOMBEROS DE IBARRA'])
  filas.push(['COMANDANCIA GENERAL — UNIDAD DE TALENTO HUMANO'])
  filas.push([`DISTRIBUTIVO DE PERSONAL ${MESES[mes-1].toUpperCase()} ${anio}`])
  filas.push([grupo.replace('_',' ')])
  filas.push([])

  // Estaciones
  estaciones.forEach(est => {
    const items = asignaciones[est.id] || []
    if (items.length === 0) return
    filas.push([est.nombre.toUpperCase()])
    filas.push(['Nombre', 'Rango', 'Tipo'])
    items.forEach(emp => {
      filas.push([emp.nombre, emp.rango, emp.esAdmin ? 'Administrativo' : 'Operativo'])
    })
    filas.push([])
  })

  // Administrativos generales
  if (zonaAdmin.length > 0) {
    filas.push(['OPERATIVOS HORARIO ADMINISTRATIVO'])
    filas.push(['Nombre', 'Rango'])
    zonaAdmin.forEach(emp => filas.push([emp.nombre, emp.rango]))
    filas.push([])
  }

  // ECU
  filas.push(['CENTRAL ECU — 911'])
  if (jornadaEcu.length > 0) {
    filas.push(['Jornada Ordinaria'])
    jornadaEcu.forEach(emp => filas.push([emp.nombre, emp.rango]))
    filas.push([])
  }
  ;['ECU_1','ECU_2','ECU_3','ECU_4'].forEach(sg => {
    const items = zonaEcu[sg] || []
    if (items.length === 0) return
    filas.push([sg.replace('_',' ')])
    items.forEach(emp => filas.push([emp.nombre, emp.rango]))
  })

  const ws = XLSX.utils.aoa_to_sheet(filas)
  ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 16 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Distributivo')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(
    new Blob([buf], { type: 'application/octet-stream' }),
    `Distributivo_${grupo.replace('_','-')}_${MESES[mes-1]}_${anio}.xlsx`
  )
}

export function exportarReemplazos(datos, mes, anio) {
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  exportarExcel([{
    nombre: 'Reemplazos',
    datos,
    columnas: [
      { label: 'Fecha',              key: 'fecha', formato: 'fecha',           ancho: 14 },
      { label: 'Empleado original',  key: 'empleadoOriginal.nombre',           ancho: 30 },
      { label: 'Rango original',     key: 'empleadoOriginal.rango',            ancho: 18 },
      { label: 'Reemplazado por',    key: 'empleadoReemplazo.nombre',          ancho: 30 },
      { label: 'Rango reemplazo',    key: 'empleadoReemplazo.rango',           ancho: 18 },
      { label: 'Estación',           key: 'estacion.nombre',                   ancho: 18 },
      { label: 'Motivo',             key: 'motivo',                            ancho: 30 },
    ]
  }], `Reemplazos_${MESES[mes-1]}_${anio}`)
}