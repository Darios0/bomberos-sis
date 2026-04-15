import { useEffect, useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDroppable
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '../api/axios'
import {
  Box, Button, Chip, CircularProgress, FormControl,
  InputLabel, MenuItem, Select, Typography, Alert, Paper, Divider
} from '@mui/material'
import { useAuth } from '../context/AuthContext'

const GRUPOS       = ['GRUPO_1', 'GRUPO_2', 'GRUPO_3', 'ECU']
const MESES        = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const PUEDE_EDITAR = ['ADMIN', 'OPERADOR']
const ECU_GRUPOS   = ['ECU_1','ECU_2','ECU_3','ECU_4']
const EST_ANCHO = '1fr'

// ── Tarjeta draggable ──────────────────────────────────────────
function TarjetaEmpleado({ emp, bloqueado }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(emp.id), disabled: bloqueado })

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...(bloqueado ? {} : { ...attributes, ...listeners })}
      sx={{
        p: '3px 6px', mb: 0.5, borderRadius: 1,
        border: '1px solid',
        borderColor: bloqueado     ? 'warning.light' :
                     emp.esAdmin  ? 'info.light'    :
                     emp.esJornadaEcu ? '#9c27b0'   : 'divider',
        bgcolor: bloqueado         ? '#fff8e1' :
                 emp.esAdmin      ? '#e3f2fd' :
                 emp.esJornadaEcu ? '#f3e5f5' : '#fff',
        cursor: bloqueado ? 'not-allowed' : 'grab',
        userSelect: 'none', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', minHeight: 32
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" fontWeight={500} display="block" lineHeight={1.2} noWrap>
          {emp.nombre}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontSize={10} noWrap>
          {emp.rango}
          {emp.esAdmin      && ' · Adm.'}
          {emp.esJornadaEcu && ' · Jorn.'}
          {emp.grupoEcu     && ` · ${emp.grupoEcu.replace('_',' ')}`}
        </Typography>
      </Box>
      {bloqueado && emp.motivoBloqueo && (
        <Chip label={emp.motivoBloqueo} size="small" color="warning"
          sx={{ fontSize: 9, height: 16, ml: 0.5, flexShrink: 0 }} />
      )}
    </Box>
  )
}

// ── Zona estación ──────────────────────────────────────────────
function ZonaEstacion({ estacion, items, puedeEditar, onQuitar }) {
  const { setNodeRef, isOver } = useDroppable({ id: `est-${estacion.id}` })
  const operativos = items.filter(i => !i.esAdmin)
  const admins     = items.filter(i => i.esAdmin)

  return (
    <Box ref={setNodeRef} sx={{
      minWidth: 0,
      border: '1px solid', borderRadius: 1, p: 1,
      borderColor: isOver ? 'primary.main' : 'divider',
      bgcolor: isOver ? '#e3f2fd' : '#fafafa',
      transition: 'all 0.15s'
    }}>
      <Typography variant="caption" fontWeight="bold" display="block"
        sx={{ mb: 0.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: 10 }}>
        {estacion.nombre}
      </Typography>
      <SortableContext items={operativos.map(i => String(i.id))} strategy={verticalListSortingStrategy}>
        {operativos.map(emp => (
          <Box key={emp.id} sx={{ position: 'relative', pr: puedeEditar ? 2 : 0 }}>
            <TarjetaEmpleado emp={emp} bloqueado={false} />
            {puedeEditar && (
              <Button onClick={() => onQuitar(emp.id, estacion.id)}
                sx={{ position:'absolute', right:-4, top:0, minWidth:18, p:0, fontSize:15, color:'error.main', lineHeight:1 }}>
                −
              </Button>
            )}
          </Box>
        ))}
      </SortableContext>
      {admins.length > 0 && (
        <>
          <Divider sx={{ my: 0.5 }}>
            <Typography variant="caption" fontSize={9} color="info.main">ADM.</Typography>
          </Divider>
          {admins.map(emp => (
            <Box key={emp.id} sx={{ position: 'relative', pr: puedeEditar ? 2 : 0 }}>
              <TarjetaEmpleado emp={emp} bloqueado={false} />
              {puedeEditar && (
                <Button onClick={() => onQuitar(emp.id, estacion.id)}
                  sx={{ position:'absolute', right:-4, top:0, minWidth:18, p:0, fontSize:15, color:'error.main', lineHeight:1 }}>
                  −
                </Button>
              )}
            </Box>
          ))}
        </>
      )}
      {items.length === 0 && (
        <Typography variant="caption" color="text.disabled" fontSize={10}>Arrastra aquí</Typography>
      )}
    </Box>
  )
}

// ── Zona Admin horizontal ──────────────────────────────────────
function ZonaAdmin({ items, puedeEditar, onQuitar }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'zona-ADMIN' })
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="info.main" fontWeight="bold" mb={0.5} display="block">
        OPERATIVOS HORARIO ADMINISTRATIVO
      </Typography>
      <Box ref={setNodeRef} sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1, p: 1,
        border: '1px dashed', borderRadius: 1, minHeight: 52,
        borderColor: isOver ? 'info.main' : 'info.light',
        bgcolor: isOver ? '#e3f2fd' : '#f8fbff',
        transition: 'all 0.15s'
      }}>
        {items.map(emp => (
          <Box key={emp.id} sx={{ width: 180, position: 'relative', pr: puedeEditar ? 2 : 0 }}>
            <TarjetaEmpleado emp={emp} bloqueado={false} />
            {puedeEditar && (
              <Button onClick={() => onQuitar('ADMIN', emp.id)}
                sx={{ position:'absolute', right:-4, top:0, minWidth:18, p:0, fontSize:15, color:'error.main', lineHeight:1 }}>
                −
              </Button>
            )}
          </Box>
        ))}
        {items.length === 0 && (
          <Typography variant="caption" color="text.disabled" fontSize={10}>
            Arrastra personal aquí
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// ── Jornada Ordinaria ECU ──────────────────────────────────────
function ZonaJornadaEcu({ items, puedeEditar, onQuitar }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'zona-JORNADA-ECU' })
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" fontWeight="bold" mb={0.5} display="block"
        sx={{ color: '#6a1b9a', textTransform: 'uppercase', fontSize: 10 }}>
        Jornada Ordinaria
      </Typography>
      <Box ref={setNodeRef} sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1, p: 1,
        border: '1px dashed', borderRadius: 1, minHeight: 48,
        borderColor: isOver ? '#9c27b0' : '#ce93d8',
        bgcolor: isOver ? '#f3e5f5' : '#fce4ec11',
        transition: 'all 0.15s'
      }}>
        {items.map(emp => (
          <Box key={emp.id} sx={{ width: EST_ANCHO, position: 'relative', pr: puedeEditar ? 2 : 0 }}>
            <TarjetaEmpleado emp={emp} bloqueado={false} />
            {puedeEditar && (
              <Button onClick={() => onQuitar('JORNADA-ECU', emp.id)}
                sx={{ position:'absolute', right:-4, top:0, minWidth:18, p:0, fontSize:15, color:'error.main', lineHeight:1 }}>
                −
              </Button>
            )}
          </Box>
        ))}
        {items.length === 0 && (
          <Typography variant="caption" color="text.disabled" fontSize={10}>
            Arrastra personal ECU de jornada ordinaria aquí
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// ── Subgrupo ECU ───────────────────────────────────────────────
function SubgrupoEcu({ nombre, items, puedeEditar, onQuitar }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zona-${nombre}` })
 return (
    <Box ref={setNodeRef} sx={{
      minWidth: 0,
      border: '1px solid', borderRadius: 1, p: 0.75,
      borderColor: isOver ? 'warning.main' : 'warning.light',
      bgcolor: isOver ? '#fff3e0' : '#fffde7',
      transition: 'all 0.15s'
    }}>
      <Typography variant="caption" fontSize={10} color="warning.dark"
        fontWeight="bold" display="block" mb={0.5}>
        {nombre.replace('_',' ')}
      </Typography>
      <SortableContext items={items.map(e => String(e.id))} strategy={verticalListSortingStrategy}>
        {items.map(emp => (
          <Box key={emp.id} sx={{ position: 'relative', pr: puedeEditar ? 2 : 0 }}>
            <TarjetaEmpleado emp={emp} bloqueado={false} />
            {puedeEditar && (
              <Button onClick={() => onQuitar(nombre, emp.id)}
                sx={{ position:'absolute', right:-4, top:0, minWidth:18, p:0, fontSize:15, color:'error.main', lineHeight:1 }}>
                −
              </Button>
            )}
          </Box>
        ))}
      </SortableContext>
      {items.length === 0 && (
        <Typography variant="caption" color="text.disabled" fontSize={9}>Arrastra aquí</Typography>
      )}
    </Box>
  )
}

// ── Zona ECU completa ──────────────────────────────────────────
function ZonaEcu({ grupos, jornadaEcu, puedeEditar, onQuitarGrupo, onQuitarJornada }) {
  return (
    <Box sx={{
      border: '1px solid #f57c00', borderRadius: 1,
      p: 1.5, bgcolor: '#fffde7'
    }}>
      <Typography variant="caption" fontWeight="bold" display="block"
        sx={{ mb: 1, color: '#e65100', textTransform: 'uppercase', fontSize: 11 }}>
        Central ECU — 911
      </Typography>

      {/* Jornada Ordinaria */}
      <ZonaJornadaEcu
        items={jornadaEcu}
        puedeEditar={puedeEditar}
        onQuitar={onQuitarJornada}
      />

      <Divider sx={{ mb: 1 }} />

      {/* 4 grupos rotativos en fila */}
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
  {ECU_GRUPOS.map(sg => (
          <SubgrupoEcu
            key={sg}
            nombre={sg}
            items={grupos[sg] || []}
            puedeEditar={puedeEditar}
            onQuitar={onQuitarGrupo}
          />
        ))}
      </Box>
    </Box>
  )
}

// ── Lista sin asignar ──────────────────────────────────────────
function ListaSinAsignar({ disponibles, bloqueados }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'lista' })
  return (
    <Box>
      <Box ref={setNodeRef} sx={{
        border: isOver ? '1px dashed #c62828' : '1px solid transparent',
        borderRadius: 1, minHeight: 40
      }}>
        <SortableContext items={disponibles.map(e => String(e.id))} strategy={verticalListSortingStrategy}>
          {disponibles.map(emp => (
            <TarjetaEmpleado key={emp.id} emp={emp} bloqueado={false} />
          ))}
        </SortableContext>
        {disponibles.length === 0 && (
          <Typography variant="caption" color="text.disabled" fontSize={10}>
            Todo asignado
          </Typography>
        )}
      </Box>
      {bloqueados.length > 0 && (
        <>
          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" fontSize={9} color="warning.main">NO DISPONIBLES</Typography>
          </Divider>
          {bloqueados.map(emp => (
            <TarjetaEmpleado key={emp.id} emp={emp} bloqueado />
          ))}
        </>
      )}
    </Box>
  )
}

// ── Principal ──────────────────────────────────────────────────
export default function Distributivo() {
  const { usuario }  = useAuth()
  const puedeEditar  = PUEDE_EDITAR.includes(usuario?.rol)
  const anioActual   = new Date().getFullYear()
  const mesActual    = new Date().getMonth() + 1

  const [grupo, setGrupo]         = useState('GRUPO_1')
  const [mes, setMes]             = useState(mesActual)
  const [anio, setAnio]           = useState(anioActual)
  const [cargando, setCargando]   = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje]     = useState('')
  const [error, setError]         = useState('')
  const [listaPersonal, setListaPersonal] = useState([])
  const [estaciones, setEstaciones]       = useState([])
  const [asignaciones, setAsignaciones]   = useState({})
  const [zonaEcu, setZonaEcu]       = useState({ ECU_1:[], ECU_2:[], ECU_3:[], ECU_4:[] })
  const [jornadaEcu, setJornadaEcu] = useState([])
  const [zonaAdmin, setZonaAdmin]   = useState([])
  const [activeEmp, setActiveEmp]   = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const cargar = useCallback(async () => {
    setCargando(true); setMensaje(''); setError('')
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const [estRes, distRes, distEcuRes] = await Promise.all([
        api.get('/estaciones'),
        api.get(`/distributivo/personal/${grupo}/${mes}/${anio}`),
        api.get(`/distributivo/personal/ECU/${mes}/${anio}`)
      ])

      const todasEst = estRes.data
      setEstaciones(todasEst)

      const { personal, distributivo } = distRes.data
      const idsAsignados = new Set()
      const nuevasAsig   = {}
      todasEst.forEach(e => { nuevasAsig[e.id] = [] })
      const nuevoAdmin = []

if (distributivo?.items?.length > 0) {
  distributivo.items.forEach(item => {
    // Marcar TODOS los items como asignados para excluirlos de la lista
    idsAsignados.add(item.empleadoId)
    const emp = { ...item.empleado, esAdmin: item.esAdmin, esEcu: item.esEcu }
    if (item.esAdmin && !item.estacionId) {
      nuevoAdmin.push(emp)
    } else if (item.estacionId && nuevasAsig[item.estacionId] !== undefined) {
      nuevasAsig[item.estacionId].push(emp)
    }
  })
}

// ECU fijo con jornada ordinaria
const nuevoEcu     = { ECU_1:[], ECU_2:[], ECU_3:[], ECU_4:[] }
const nuevoJornada = []

const distEcu = distEcuRes.data
if (distEcu?.distributivo?.items?.length > 0) {
  distEcu.distributivo.items.forEach(item => {
    // IMPORTANTE: agregar al set principal de asignados
    idsAsignados.add(item.empleadoId)
    const emp = { ...item.empleado, esEcu: true }
    if (item.esJornadaEcu) {
      nuevoJornada.push({ ...emp, esJornadaEcu: true })
    } else {
      const sg = item.empleado.grupoEcu || 'ECU_1'
      if (nuevoEcu[sg]) nuevoEcu[sg].push(emp)
    }
  })
}

      setAsignaciones(nuevasAsig)
      setZonaAdmin(nuevoAdmin)
      setZonaEcu(nuevoEcu)
      setJornadaEcu(nuevoJornada)

      setListaPersonal(
        personal
          .filter(p => !idsAsignados.has(p.id))
          .map(p => {
            const ausenciaActiva = p.ausencias?.some(a => {
              const ini = new Date(a.fechaInicio).toISOString().split('T')[0]
              const fin = new Date(a.fechaFin).toISOString().split('T')[0]
              return ini <= hoy && fin >= hoy
            })
            return { ...p, bloqueado: ausenciaActiva, motivoBloqueo: p.ausencias?.[0]?.tipo || null }
          })
      )
    } catch (e) {
      console.error(e)
      setError('Error al cargar el distributivo')
    } finally {
      setCargando(false)
    }
  }, [grupo, mes, anio])

  useEffect(() => { cargar() }, [cargar])

  const encontrarZona = (empId) => {
    if (listaPersonal.find(e => e.id === empId)) return 'lista'
    for (const [estId, emps] of Object.entries(asignaciones)) {
      if (emps.find(e => e.id === empId)) return `est-${estId}`
    }
    for (const sg of ECU_GRUPOS) {
      if ((zonaEcu[sg] || []).find(e => e.id === empId)) return `zona-${sg}`
    }
    if (jornadaEcu.find(e => e.id === empId)) return 'zona-JORNADA-ECU'
    if (zonaAdmin.find(e => e.id === empId))  return 'zona-ADMIN'
    return null
  }

  const getEmp = (empId) =>
    listaPersonal.find(e => e.id === empId) ||
    Object.values(asignaciones).flat().find(e => e.id === empId) ||
    Object.values(zonaEcu).flat().find(e => e.id === empId) ||
    jornadaEcu.find(e => e.id === empId) ||
    zonaAdmin.find(e => e.id === empId)

  const handleDragStart = ({ active }) => {
    setActiveEmp(getEmp(parseInt(active.id)) || null)
  }

const handleDragOver = ({ active, over }) => {
  if (!over || !puedeEditar) return
  const empId  = parseInt(active.id)
  const overId = over.id

  const origenZona  = encontrarZona(empId)
  if (!origenZona) return

  // Reordenar dentro de la misma estación
  if (origenZona.startsWith('est-') && over.id.startsWith('est-')) return
  if (!origenZona.startsWith('est-')) return

  const estId  = parseInt(origenZona.replace('est-', ''))
  const lista  = asignaciones[estId] || []

  // El overId puede ser el id de un empleado (para reordenar)
  const overEmpId = parseInt(overId)
  if (isNaN(overEmpId)) return

  const oldIdx = lista.findIndex(e => e.id === empId)
  const newIdx = lista.findIndex(e => e.id === overEmpId)

  if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return

  setAsignaciones(p => ({
    ...p,
    [estId]: arrayMove(p[estId], oldIdx, newIdx)
  }))
}

 const handleDragEnd = ({ active, over }) => {
  setActiveEmp(null)
  if (!puedeEditar) return
  if (!over) return

  const empId  = parseInt(active.id)
  const destId = over.id
  const origen = encontrarZona(empId)
  if (!origen) return

  // Si está bloqueado no mover
  if (listaPersonal.find(e => e.id === empId && e.bloqueado)) return

  // Si el destino es un empleado dentro de la misma estación — ya fue reordenado en dragOver
  const destEsEmpleado = !isNaN(parseInt(destId))
  if (destEsEmpleado) {
    const destEmpZona = encontrarZona(parseInt(destId))
    if (destEmpZona === origen) return // mismo contenedor — ya reordenado
  }

  // Si origen y destino son el mismo contenedor — no hacer nada
  if (origen === destId) return

  // Obtener el empleado
  let emp = null
  if (origen === 'lista') {
    emp = listaPersonal.find(e => e.id === empId)
  } else if (origen.startsWith('est-')) {
    const estId = parseInt(origen.replace('est-', ''))
    emp = asignaciones[estId]?.find(e => e.id === empId)
  } else if (origen.startsWith('zona-ECU_')) {
    const sg = origen.replace('zona-', '')
    emp = (zonaEcu[sg] || []).find(e => e.id === empId)
  } else if (origen === 'zona-JORNADA-ECU') {
    emp = jornadaEcu.find(e => e.id === empId)
  } else if (origen === 'zona-ADMIN') {
    emp = zonaAdmin.find(e => e.id === empId)
  }

  if (!emp) return

  // Determinar zona destino real (si soltó sobre un empleado, usar su zona)
  let zonaDestino = destId
  if (destEsEmpleado) {
    zonaDestino = encontrarZona(parseInt(destId)) || destId
  }

  // Quitar del origen
  if (origen === 'lista') {
    setListaPersonal(p => p.filter(e => e.id !== empId))
  } else if (origen.startsWith('est-')) {
    const estId = parseInt(origen.replace('est-', ''))
    setAsignaciones(p => ({ ...p, [estId]: p[estId].filter(e => e.id !== empId) }))
  } else if (origen.startsWith('zona-ECU_')) {
    const sg = origen.replace('zona-', '')
    setZonaEcu(p => ({ ...p, [sg]: p[sg].filter(e => e.id !== empId) }))
  } else if (origen === 'zona-JORNADA-ECU') {
    setJornadaEcu(p => p.filter(e => e.id !== empId))
  } else if (origen === 'zona-ADMIN') {
    setZonaAdmin(p => p.filter(e => e.id !== empId))
  }

  // Poner en destino
  if (zonaDestino === 'lista') {
    setListaPersonal(p => [...p, { ...emp, bloqueado: false }])
  } else if (zonaDestino.startsWith('zona-ECU_')) {
    const sg = zonaDestino.replace('zona-', '')
    setZonaEcu(p => ({ ...p, [sg]: [...(p[sg]||[]), { ...emp, esEcu: true, grupoEcu: sg, esJornadaEcu: false }] }))
  } else if (zonaDestino === 'zona-JORNADA-ECU') {
    setJornadaEcu(p => [...p, { ...emp, esEcu: true, esJornadaEcu: true }])
  } else if (zonaDestino === 'zona-ADMIN') {
    setZonaAdmin(p => [...p, { ...emp, esAdmin: true }])
  } else if (zonaDestino.startsWith('est-')) {
    const estId = parseInt(zonaDestino.replace('est-', ''))
    setAsignaciones(p => ({ ...p, [estId]: [...(p[estId]||[]), emp] }))
  } else {
    // Destino no reconocido — devolver al origen
    if (origen === 'lista') setListaPersonal(p => [...p, emp])
    else if (origen.startsWith('est-')) {
      const estId = parseInt(origen.replace('est-', ''))
      setAsignaciones(p => ({ ...p, [estId]: [...p[estId], emp] }))
    } else if (origen.startsWith('zona-ECU_')) {
      const sg = origen.replace('zona-', '')
      setZonaEcu(p => ({ ...p, [sg]: [...p[sg], emp] }))
    } else if (origen === 'zona-JORNADA-ECU') setJornadaEcu(p => [...p, emp])
    else if (origen === 'zona-ADMIN') setZonaAdmin(p => [...p, emp])
  }
}
  const quitarDeEstacion = (empId, estId) => {
    const emp = asignaciones[estId]?.find(e => e.id === empId)
    if (!emp) return
    setAsignaciones(p => ({ ...p, [estId]: p[estId].filter(e => e.id !== empId) }))
    setListaPersonal(p => [...p, { ...emp, bloqueado: false }])
  }

  const quitarDeGrupoEcu = (sg, empId) => {
    const emp = (zonaEcu[sg]||[]).find(e => e.id === empId)
    if (!emp) return
    setZonaEcu(p => ({ ...p, [sg]: p[sg].filter(e => e.id !== empId) }))
    setListaPersonal(p => [...p, { ...emp, bloqueado: false }])
  }

  const quitarDeZona = (zona, empId) => {
    if (zona === 'ADMIN') {
      const emp = zonaAdmin.find(e => e.id === empId)
      if (!emp) return
      setZonaAdmin(p => p.filter(e => e.id !== empId))
      setListaPersonal(p => [...p, { ...emp, bloqueado: false }])
    } else if (zona === 'JORNADA-ECU') {
      const emp = jornadaEcu.find(e => e.id === empId)
      if (!emp) return
      setJornadaEcu(p => p.filter(e => e.id !== empId))
      setListaPersonal(p => [...p, { ...emp, bloqueado: false }])
    }
  }

  const guardar = async () => {
    setGuardando(true); setMensaje(''); setError('')
    try {
      const items = []
      Object.entries(asignaciones).forEach(([estId, emps]) => {
        emps.forEach((emp, idx) => {
          items.push({ empleadoId: emp.id, estacionId: parseInt(estId), esEcu: false, esAdmin: emp.esAdmin||false, esJornadaEcu: false, orden: idx })
        })
      })
      zonaAdmin.forEach((emp, idx) => {
        items.push({ empleadoId: emp.id, estacionId: null, esEcu: false, esAdmin: true, esJornadaEcu: false, orden: idx })
      })
      await api.post('/distributivo/guardar', { grupo, mes, anio, items })

      const itemsEcu = []
      jornadaEcu.forEach((emp, idx) => {
        itemsEcu.push({ empleadoId: emp.id, estacionId: null, esEcu: true, esAdmin: false, esJornadaEcu: true, orden: idx })
      })
      ECU_GRUPOS.forEach(sg => {
        ;(zonaEcu[sg]||[]).forEach((emp, idx) => {
          itemsEcu.push({ empleadoId: emp.id, estacionId: null, esEcu: true, esAdmin: false, esJornadaEcu: false, orden: idx })
        })
      })
      await api.post('/distributivo/guardar', { grupo: 'ECU', mes, anio, items: itemsEcu })

      setMensaje('Distributivo guardado correctamente')
    } catch {
      setError('Error al guardar el distributivo')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <Box sx={{ p:4, display:'flex', justifyContent:'center' }}><CircularProgress /></Box>

  const disponibles = listaPersonal.filter(e => !e.bloqueado)
  const bloqueados  = listaPersonal.filter(e => e.bloqueado)

  return (
    <Box>
      {/* Controles */}
      <Box sx={{ display:'flex', gap:2, mb:2, alignItems:'center', flexWrap:'wrap' }}>
        <Typography variant="h5" fontWeight="bold" sx={{ flex:1 }}>Distributivo mensual</Typography>
        <FormControl size="small" sx={{ minWidth:130 }}>
          <InputLabel>Grupo</InputLabel>
          <Select value={grupo} label="Grupo" onChange={e => setGrupo(e.target.value)}>
            {GRUPOS.map(g => <MenuItem key={g} value={g}>{g.replace('_',' ')}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth:120 }}>
          <InputLabel>Mes</InputLabel>
          <Select value={mes} label="Mes" onChange={e => setMes(e.target.value)}>
            {MESES.map((m,i) => <MenuItem key={i} value={i+1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth:90 }}>
          <InputLabel>Año</InputLabel>
          <Select value={anio} label="Año" onChange={e => setAnio(e.target.value)}>
            {[2025,2026,2027].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        {puedeEditar && (
          <Button variant="contained" sx={{ bgcolor:'#c62828' }} onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar distributivo'}
          </Button>
        )}
      </Box>

      {mensaje && <Alert severity="success" sx={{ mb:2 }}>{mensaje}</Alert>}
      {error   && <Alert severity="error"   sx={{ mb:2 }}>{error}</Alert>}
      {!puedeEditar && <Alert severity="info" sx={{ mb:2 }}>Solo visualización</Alert>}

      <DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
>
        <Box sx={{ display:'flex', gap:2, alignItems:'flex-start' }}>

          {/* Panel izquierdo */}
          <Paper sx={{ width:185, flexShrink:0, p:1.5, maxHeight:'82vh', overflowY:'auto', position:'sticky', top:0 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>
              Sin asignar ({disponibles.length})
            </Typography>
            <ListaSinAsignar disponibles={disponibles} bloqueados={bloqueados} />
          </Paper>

          {/* Panel derecho con scroll */}
      <Box sx={{ flex:1, minWidth: 0 }}>
  <Box>

              {/* Fila 1 — X1 a X4 */}
              <Typography variant="caption" color="text.secondary" fontWeight="bold" mb={0.5} display="block">
                COMPAÑÍAS X1 — X4
              </Typography>
           <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:1, mb:2 }}>
  {estaciones.slice(0,4).map(est => (
    <ZonaEstacion key={est.id} estacion={est}
                    items={asignaciones[est.id]||[]}
                    puedeEditar={puedeEditar} onQuitar={quitarDeEstacion} />
                ))}
              </Box>

              {/* Fila 2 — X5 a X8 */}
              <Typography variant="caption" color="text.secondary" fontWeight="bold" mb={0.5} display="block">
                COMPAÑÍAS X5 — X8
              </Typography>
             <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:1, mb:2 }}>
  {estaciones.slice(4,8).map(est => (
    <ZonaEstacion key={est.id} estacion={est}
                    items={asignaciones[est.id]||[]}
                    puedeEditar={puedeEditar} onQuitar={quitarDeEstacion} />
                ))}
              </Box>

              {/* Administrativo */}
              <ZonaAdmin items={zonaAdmin} puedeEditar={puedeEditar} onQuitar={quitarDeZona} />

              {/* ECU completo */}
              <ZonaEcu
                grupos={zonaEcu}
                jornadaEcu={jornadaEcu}
                puedeEditar={puedeEditar}
                onQuitarGrupo={quitarDeGrupoEcu}
                onQuitarJornada={quitarDeZona}
              />
            </Box>
          </Box>
        </Box>

        <DragOverlay>
          {activeEmp && (
            <Box sx={{ p:'4px 10px', borderRadius:1, bgcolor:'white', border:'2px solid #c62828', boxShadow:4 }}>
              <Typography variant="caption" fontWeight={500}>{activeEmp.nombre}</Typography>
            </Box>
          )}
        </DragOverlay>
      </DndContext>
    </Box>
  )
}