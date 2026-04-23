const express   = require('express')
const puppeteer = require('puppeteer')
const prisma    = require('../prisma/client')
const router    = express.Router()

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function filaPersona(emp, esAdmin = false) {
  return `
    <tr>
      <td style="padding:2px 4px;border-bottom:1px solid #eee;font-size:9px;font-weight:500;color:#111">
        ${emp.nombre}${esAdmin ? ' <span style="font-size:8px;background:#bbdefb;color:#0d47a1;padding:0 3px;border-radius:2px">Adm</span>' : ''}
      </td>
      <td style="padding:2px 4px;border-bottom:1px solid #eee;font-size:8px;color:#555">${emp.rango}</td>
    </tr>`
}

function cardEstacion(nombre, operativos, admins) {
  const sinPersonal = operativos.length === 0 && admins.length === 0
  return `
    <div style="border:1px solid #ccc;border-radius:4px;overflow:hidden;break-inside:avoid">
      <div style="background:#e8e8e8;padding:3px 6px;font-size:9px;font-weight:bold;text-transform:uppercase;color:#222;border-bottom:1px solid #ccc">
        ${nombre}
      </div>
      <div style="padding:2px 4px;min-height:30px">
        ${sinPersonal ? '<p style="font-size:8px;color:#aaa;font-style:italic;margin:4px 0">Sin personal asignado</p>' : ''}
        <table style="width:100%;border-collapse:collapse">
          ${operativos.map(e => filaPersona(e, false)).join('')}
          ${admins.map(e => filaPersona(e, true)).join('')}
        </table>
      </div>
    </div>`
}

router.get('/distributivo/:grupo/:mes/:anio', async (req, res) => {
  try {
    const { grupo, mes, anio } = req.params
    const esEcu   = grupo === 'ECU'
    const mesInt  = parseInt(mes)
    const anioInt = parseInt(anio)
    const mesLabel = MESES[mesInt - 1]

    const distributivo = await prisma.distributivo.findFirst({
      where: {
        mes: mesInt, anio: anioInt,
        grupo: esEcu ? null : grupo,
        esEcu
      },
      include: {
        items: {
          orderBy: { orden: 'asc' },
          include: { empleado: true, estacion: true }
        }
      }
    })

// Siempre cargar el distributivo ECU por separado
const distributivoEcu = await prisma.distributivo.findFirst({
  where: { mes: mesInt, anio: anioInt, esEcu: true },
  include: {
    items: {
      orderBy: { orden: 'asc' },
      include: { empleado: true }
    }
  }
})


    const estaciones = await prisma.estacion.findMany({ orderBy: { id: 'asc' } })

    // Organizar datos
    const porEst = {}
    estaciones.forEach(e => { porEst[e.id] = { nombre: e.nombre, op: [], adm: [] } })
    const admGen  = []
    const ecuJorn = []
    const ecuGrp  = { ECU_1: [], ECU_2: [], ECU_3: [], ECU_4: [] }

// Procesar items del distributivo operativo
distributivo?.items?.forEach(item => {
  const e = item.empleado
  if (item.esAdmin && !item.estacionId) {
    admGen.push(e)
  } else if (item.estacionId && porEst[item.estacionId]) {
    if (item.esAdmin) porEst[item.estacionId].adm.push(e)
    else              porEst[item.estacionId].op.push(e)
  }
})

// Procesar items del distributivo ECU separado
distributivoEcu?.items?.forEach(item => {
  const e = item.empleado
  if (item.esJornadaEcu) {
    ecuJorn.push(e)
  } else {
    const sg = e.grupoEcu || 'ECU_1'
    if (ecuGrp[sg]) ecuGrp[sg].push(e)
  }
})

    const grupoLabel = grupo.replace('_', ' ')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    color: #111;
    background: white;
    padding: 14px 16px;
  }
  h1 { font-size:13px; font-weight:bold; text-align:center; text-transform:uppercase; }
  h2 { font-size:11px; font-weight:bold; text-align:center; margin-top:2px; }
  .subtitulo { font-size:10px; text-align:center; color:#444; margin-top:2px; }
  .grupo-badge {
    display:inline-block; margin:6px auto 10px;
    background:#c62828; color:white;
    padding:2px 14px; border-radius:3px;
    font-size:10px; font-weight:bold;
    text-transform:uppercase;
  }
  .centrado { text-align:center; }
  .seccion {
    font-size:10px; font-weight:bold;
    text-transform:uppercase; color:#444;
    border-bottom:1.5px solid #bbb;
    padding-bottom:2px; margin:10px 0 5px;
  }
  .grid4 {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:6px;
    margin-bottom:8px;
  }
  .grid-adm {
    display:grid;
    grid-template-columns:repeat(5,1fr);
    gap:5px;
  }
  .adm-box {
    border:1px dashed #90caf9;
    border-radius:4px;
    padding:3px 5px;
    background:#f8fbff;
  }
  .ecu-box {
    border:1.5px solid #f57c00;
    border-radius:5px;
    overflow:hidden;
    margin-top:10px;
  }
  .ecu-header {
    background:#fff3e0;
    padding:4px 8px;
    font-size:11px;
    font-weight:bold;
    color:#e65100;
    text-transform:uppercase;
    border-bottom:1px solid #ffe0b2;
  }
  .ecu-body { padding:6px; }
  .ecu-jornada {
    background:#f3e5f5;
    border-left:3px solid #9c27b0;
    padding:3px 6px;
    border-radius:3px;
    margin-bottom:6px;
  }
  .ecu-jornada-titulo {
    font-size:9px; font-weight:bold;
    color:#6a1b9a; text-transform:uppercase;
    margin-bottom:3px;
  }
  .ecu-grid {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:5px;
  }
  .ecu-grupo {
    border:1px solid #ffe0b2;
    border-radius:3px;
    overflow:hidden;
  }
  .ecu-grupo-header {
    background:#fff3e0;
    padding:2px 4px;
    font-size:9px;
    font-weight:bold;
    color:#e65100;
    text-align:center;
    border-bottom:1px solid #ffe0b2;
  }
  .ecu-grupo-body { padding:2px 4px; }
  .pie {
    margin-top:14px;
    font-size:8px;
    color:#999;
    text-align:right;
    border-top:1px solid #eee;
    padding-top:4px;
  }
</style>
</head>
<body>

<h1>Cuerpo de Bomberos de Ibarra</h1>
<h2>Segunda Jefatura de Bomberos</h2>
<p class="subtitulo">Distributivo de Personal ${mesLabel} ${anioInt}</p>
<div class="centrado">
  <span class="grupo-badge">${esEcu ? 'Central ECU — 911' : grupoLabel}</span>
</div>

${!esEcu ? `
<div class="seccion"></div>
<div class="grid4">
  ${estaciones.slice(0,4).map(e =>
    cardEstacion(e.nombre, porEst[e.id]?.op || [], porEst[e.id]?.adm || [])
  ).join('')}
</div>

<div class="seccion"></div>
<div class="grid4">
  ${estaciones.slice(4,8).map(e =>
    cardEstacion(e.nombre, porEst[e.id]?.op || [], porEst[e.id]?.adm || [])
  ).join('')}
</div>

${admGen.length > 0 ? `
<div class="seccion">Operativos Horario Administrativo</div>
<div class="grid-adm">
  ${admGen.map(e => `
    <div class="adm-box">
      <div style="font-size:9px;font-weight:500;color:#111">${e.nombre}</div>
      <div style="font-size:8px;color:#555">${e.rango}</div>
    </div>
  `).join('')}
</div>` : ''}
` : ''}

<div class="ecu-box">
  <div class="ecu-header">Central ECU — 911</div>
  <div class="ecu-body">
    ${ecuJorn.length > 0 ? `
    <div class="ecu-jornada">
      <div class="ecu-jornada-titulo">Jornada Ordinaria</div>
      <table style="width:100%;border-collapse:collapse">
        ${ecuJorn.map(e => filaPersona(e)).join('')}
      </table>
    </div>` : ''}
    <div class="ecu-grid">
      ${['ECU_1','ECU_2','ECU_3','ECU_4'].map(sg => `
        <div class="ecu-grupo">
          <div class="ecu-grupo-header">${sg.replace('_',' ')}</div>
          <div class="ecu-grupo-body">
            ${ecuGrp[sg].length === 0
              ? '<p style="font-size:8px;color:#aaa;font-style:italic;margin:2px 0">Sin asignar</p>'
              : `<table style="width:100%;border-collapse:collapse">
                  ${ecuGrp[sg].map(e => filaPersona(e)).join('')}
                </table>`
            }
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</div>

<div class="pie">
  Generado el ${new Date().toLocaleDateString('es-EC', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })}
</div>

</body>
</html>`

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    const pdf = await page.pdf({
      format:          'A4',
      landscape:       true,
      printBackground: true,
      margin: { top: '12mm', bottom: '10mm', left: '10mm', right: '10mm' }
    })

    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition',
      `inline; filename="distributivo-${grupoLabel}-${mesLabel}-${anioInt}.pdf"`)
    res.end(pdf)

  } catch (error) {
    console.error('Error PDF:', error)
    res.status(500).json({ error: 'Error al generar PDF: ' + error.message })
  }
})
// GET /api/pdf/reporte/empleado/:id
router.get('/reporte/empleado/:id', async (req, res) => {
  try {
    const id  = parseInt(req.params.id)
    const res2 = await fetch(`http://localhost:3001/api/reportes/resumen-empleado/${id}`)
    const data = await res2.json()
    const r    = data

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box }
  body { font-family:Arial,sans-serif;font-size:10px;color:#111;padding:16px }
  h1 { font-size:13px;font-weight:bold;text-align:center;text-transform:uppercase }
  h2 { font-size:11px;text-align:center;margin-top:2px }
  .sub { font-size:10px;text-align:center;color:#444;margin-top:2px }
  .emp { background:#c62828;color:white;padding:8px 12px;border-radius:4px;margin:10px 0 }
  .emp-nombre { font-size:13px;font-weight:bold }
  .emp-sub { font-size:10px;opacity:0.85;margin-top:2px }
  .metrics { display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px }
  .metric { border:1px solid #ddd;border-radius:4px;padding:6px;text-align:center }
  .metric-val { font-size:18px;font-weight:bold }
  .metric-lab { font-size:8px;color:#666 }
  table { width:100%;border-collapse:collapse;margin-bottom:10px }
  th { background:#f0f0f0;padding:3px 5px;font-size:9px;text-align:left;border-bottom:1px solid #ddd }
  td { padding:3px 5px;font-size:9px;border-bottom:1px solid #f5f5f5 }
  .sec { font-size:10px;font-weight:bold;text-transform:uppercase;color:#444;
         border-bottom:1.5px solid #bbb;padding-bottom:2px;margin:8px 0 5px }
  .chip { display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;color:white;font-weight:bold }
</style>
</head><body>
<h1>Cuerpo de Bomberos de Ibarra</h1>
<h2>Unidad de Talento Humano — Reporte de Personal</h2>

<div class="emp">
  <div class="emp-nombre">${r.empleado.nombre}</div>
  <div class="emp-sub">${r.empleado.rango} — ${r.empleado.grupoOperativo?.replace('_',' ') || r.empleado.tipoPersonal}</div>
</div>

<div class="sec">Resumen general</div>
<div class="metrics">
  <div class="metric"><div class="metric-val" style="color:#f57c00">${r.totalVacaciones}</div><div class="metric-lab">Vacaciones</div></div>
  <div class="metric"><div class="metric-val" style="color:#d32f2f">${r.totalEnfermedades}</div><div class="metric-lab">Enfermedades</div></div>
  <div class="metric"><div class="metric-val" style="color:#0288d1">${r.totalPermisos}</div><div class="metric-lab">Permisos</div></div>
  <div class="metric"><div class="metric-val" style="color:#7b1fa2">${r.totalFaltas}</div><div class="metric-lab">Faltas</div></div>
  <div class="metric"><div class="metric-val" style="color:#455a64">${r.totalAtrasos}</div><div class="metric-lab">Atrasos</div></div>
  <div class="metric"><div class="metric-val" style="color:#2e7d32">${r.totalMeritos}</div><div class="metric-lab">Méritos</div></div>
  <div class="metric"><div class="metric-val" style="color:#c62828">${r.totalDemeritos}</div><div class="metric-lab">Deméritos</div></div>
  <div class="metric"><div class="metric-val" style="color:#1565c0">${r.historial.length}</div><div class="metric-lab">Estaciones</div></div>
</div>

${r.historial.length > 0 ? `
<div class="sec">Historial de estaciones</div>
<table>
  <tr><th>Estación</th><th>Desde</th><th>Hasta</th><th>Duración</th></tr>
  ${r.historial.map(h => {
    const dias  = h.dias
    const anios = Math.floor(dias/365)
    const meses = Math.floor((dias%365)/30)
    const dur   = anios > 0 ? `${anios}a ${meses}m` : meses > 0 ? `${meses}m` : `${dias}d`
    return `<tr>
      <td>${h.estacion.nombre}</td>
      <td>${new Date(h.fechaInicio).toLocaleDateString('es-EC')}</td>
      <td>${h.fechaFin ? new Date(h.fechaFin).toLocaleDateString('es-EC') : 'Actualmente'}</td>
      <td>${dur}</td>
    </tr>`
  }).join('')}
</table>` : ''}

${r.ausencias.length > 0 ? `
<div class="sec">Ausencias registradas</div>
<table>
  <tr><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Detalle</th></tr>
  ${r.ausencias.map(a => `<tr>
    <td>${a.tipo}</td>
    <td>${new Date(a.fechaInicio).toLocaleDateString('es-EC')}</td>
    <td>${new Date(a.fechaFin).toLocaleDateString('es-EC')}</td>
    <td>${a.tipoPermiso || a.descripcion || '—'}</td>
  </tr>`).join('')}
</table>` : ''}

${r.evaluaciones.length > 0 ? `
<div class="sec">Méritos y deméritos</div>
<table>
  <tr><th>Tipo</th><th>Descripción</th><th>Fecha</th></tr>
  ${r.evaluaciones.map(ev => `<tr>
    <td>${ev.tipo}</td>
    <td>${ev.descripcion}</td>
    <td>${new Date(ev.fecha).toLocaleDateString('es-EC')}</td>
  </tr>`).join('')}
</table>` : ''}

<div style="margin-top:14px;font-size:8px;color:#999;text-align:right;border-top:1px solid #eee;padding-top:4px">
  Generado el ${new Date().toLocaleDateString('es-EC', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}
</div>
</body></html>`

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    const pdf = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top:'12mm', bottom:'10mm', left:'12mm', right:'12mm' }
    })
    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition',
      `inline; filename="reporte-${r.empleado.nombre.replace(/ /g,'-')}.pdf"`)
    res.end(pdf)
  } catch (error) {
    console.error('Error PDF reporte:', error)
    res.status(500).json({ error: 'Error al generar PDF: ' + error.message })
  }
})
module.exports = router