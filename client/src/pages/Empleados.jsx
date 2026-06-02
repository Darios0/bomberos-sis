import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel,
  InputLabel, MenuItem, Paper, Select, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography, Alert, Tabs, Tab
} from '@mui/material'
import EmpleadoDetalle from './EmpleadoDetalle'
import { usePermisos } from '../hooks/usePermisos'

const RANGOS = [
  'Bombero', 'Suboficial', 'Cabo', 'Sargento', 'Subteniente',
  'Teniente', 'Capitán', 'Mayor', 'Teniente Coronel', 'Coronel', 'Otro'
]
const GRUPOS_OPERATIVOS = ['GRUPO_1', 'GRUPO_2', 'GRUPO_3']
const GRUPOS_ECU        = ['ECU_1', 'ECU_2', 'ECU_3', 'ECU_4']
const TIPOS             = ['OPERATIVO', 'ECU', 'ADMINISTRATIVO']

const INICIAL = {
  nombre: '', cedula: '', rango: '',
  tipoPersonal: 'OPERATIVO',
  grupoOperativo: '', grupoEcu: '', estacionId: '',
  esParamedico: false,
  antiguedad: ''
}

const COLOR_TIPO = { OPERATIVO: 'error', ECU: 'warning', ADMINISTRATIVO: 'info' }
const COLOR_GRUPO = {
  GRUPO_1: 'error', GRUPO_2: 'primary', GRUPO_3: 'success',
  ECU_1: 'warning', ECU_2: 'warning', ECU_3: 'warning', ECU_4: 'warning'
}



export default function Empleados() {
  const [empleados, setEmpleados]   = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [cargando, setCargando]     = useState(true)
  const [dialogo, setDialogo]       = useState(false)
  const [form, setForm]             = useState(INICIAL)
  const [editando, setEditando]     = useState(null)
  const [error, setError]           = useState('')
  const [busqueda, setBusqueda]     = useState('')
  const [empleadoDetalle, setEmpleadoDetalle] = useState(null)
  const [tabActual, setTabActual]   = useState(0)
  const { puedeGestionarPersonal, puedeRegistrarAusencias } = usePermisos()

  
  const cargar = async () => {
    try {
      const [empRes, estRes] = await Promise.all([
        api.get('/empleados'),
        api.get('/estaciones')
      ])
      setEmpleados(empRes.data)
      setEstaciones(estRes.data)
    } catch {
      setError('Error al cargar datos')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(INICIAL)
    setError('')
    setDialogo(true)
  }

  const abrirEditar = (emp) => {
    setEditando(emp.id)
    setForm({
      nombre:         emp.nombre,
      cedula:         emp.cedula,
      rango:          emp.rango,
      tipoPersonal:   emp.tipoPersonal,
      grupoOperativo: emp.grupoOperativo || '',
      grupoEcu:       emp.grupoEcu || '',
      estacionId:     emp.estacionId || '',
      esParamedico:   emp.esParamedico || false,
      antiguedad: emp.antiguedad || ''
    })
    setError('')
    setDialogo(true)
  }

  const cerrar = () => { setDialogo(false); setError('') }

  const guardar = async () => {
  if (!form.nombre || !form.cedula || !form.rango || !form.tipoPersonal) {
    setError('Nombre, cédula, rango y tipo son requeridos')
    return
  }
  if (form.tipoPersonal === 'OPERATIVO' && !form.grupoOperativo) {
    setError('Selecciona el grupo operativo')
    return
  }
  if (form.tipoPersonal === 'ECU' && !form.grupoEcu) {
    setError('Selecciona el grupo ECU')
    return
  }

  const payload = {
    nombre:         form.nombre,
    cedula:         form.cedula,
    rango:          form.rango,
    tipoPersonal:   form.tipoPersonal,
    grupoOperativo: form.tipoPersonal === 'OPERATIVO' ? form.grupoOperativo : null,
    grupoEcu:       form.tipoPersonal === 'ECU'       ? form.grupoEcu       : null,
    estacionId:     form.estacionId   ? parseInt(form.estacionId)           : null,
    esParamedico:   Boolean(form.esParamedico),
    antiguedad:     form.antiguedad   ? parseInt(form.antiguedad)           : 99
  }

  console.log('Enviando payload:', payload)

  try {
    if (editando) {
      payload.activo = form.activo
      await api.put(`/empleados/${editando}`, payload)
    } else {
      await api.post('/empleados', payload)
    }
    cerrar()
    cargar()
  } catch (err) {
    setError(err.response?.data?.error || 'Error al guardar')
  }
}

  const activar = async (id) => {
  if (!confirm('¿Reactivar este empleado?')) return
  await api.put(`/empleados/${id}`, { activo: true })
  cargar()
}
  const desactivar = async (id) => {
    if (!confirm('¿Desactivar este empleado?')) return
    await api.delete(`/empleados/${id}`)
    cargar()
  }

  const TABS = ['Todos', 'Operativo', 'ECU', 'Administrativo']

  const filtrados = empleados.filter(e => {
    const coincideBusqueda =
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.cedula.includes(busqueda)
    const coincideTab =
      tabActual === 0 ? true :
      tabActual === 1 ? e.tipoPersonal === 'OPERATIVO' :
      tabActual === 2 ? e.tipoPersonal === 'ECU' :
      e.tipoPersonal === 'ADMINISTRATIVO'
    return coincideBusqueda && coincideTab
  })

  const nombreEstacion = (id) =>
    estaciones.find(e => e.id === id)?.nombre || '—'

  if (cargando) return <Box sx={{ p: 4 }}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Personal — {empleados.length} registrados
        </Typography>
      {puedeGestionarPersonal && (
  <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={abrirCrear}>
    + Nuevo empleado
  </Button>
)}
      </Box>

      <TextField
        placeholder="Buscar por nombre o cédula..."
        fullWidth size="small" sx={{ mb: 1 }}
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      <Tabs value={tabActual} onChange={(_, v) => setTabActual(v)} sx={{ mb: 2 }}>
        {TABS.map(t => <Tab key={t} label={t} />)}
      </Tabs>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Cédula</b></TableCell>
              <TableCell><b>Rango</b></TableCell> 
              <TableCell><b>Antigüedad</b></TableCell>
              <TableCell><b>Tipo</b></TableCell>
              <TableCell><b>Grupo</b></TableCell>
              <TableCell><b>Paramédico</b></TableCell>
              <TableCell><b>Estación</b></TableCell>
              <TableCell><b>Estado</b></TableCell>
              <TableCell><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrados.map(emp => (
              <TableRow key={emp.id} hover>
                <TableCell>{emp.nombre}</TableCell>
                <TableCell>{emp.cedula}</TableCell>
                <TableCell>{emp.rango}</TableCell>
                <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {emp.antiguedad && emp.antiguedad !== 99 ? emp.antiguedad : '—'}
                </Typography>
              </TableCell>
                <TableCell>
  {emp.esParamedico && (
    <Chip label="Paramédico" size="small"
      sx={{ bgcolor: '#ff69b4', color: 'white', fontSize: 10 }} />
  )}
</TableCell>
                <TableCell>
                  <Chip
                    label={emp.tipoPersonal}
                    color={COLOR_TIPO[emp.tipoPersonal]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {emp.grupoOperativo &&
                    <Chip label={emp.grupoOperativo.replace('_', ' ')} color={COLOR_GRUPO[emp.grupoOperativo]} size="small" />
                  }
                  {emp.grupoEcu &&
                    <Chip label={emp.grupoEcu.replace('_', ' ')} color="warning" size="small" />
                  }
                  {emp.tipoPersonal === 'ADMINISTRATIVO' && '—'}
                </TableCell>
                <TableCell>{nombreEstacion(emp.estacionId)}</TableCell>
                <TableCell>
                  <Chip
                    label={emp.activo ? 'Activo' : 'Inactivo'}
                    color={emp.activo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                    {puedeGestionarPersonal && (
                      <Button size="small" onClick={() => abrirEditar(emp)}>Editar</Button>
                    )}
                    <Button size="small" color="info" onClick={() => setEmpleadoDetalle(emp)}>
                      {puedeRegistrarAusencias ? 'Detalle' : 'Ver'}
                    </Button>
                    {puedeGestionarPersonal && emp.activo && (
                      <Button size="small" color="error" onClick={() => desactivar(emp.id)}>
                        Desactivar
                      </Button>
                    )}
                    {puedeGestionarPersonal && !emp.activo && (
                      <Button size="small" color="success" onClick={() => activar(emp.id)}>
                        Activar
                      </Button>
                    )}
</TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No se encontraron empleados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogo crear/editar */}
      <Dialog open={dialogo} onClose={cerrar} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Nombre completo" fullWidth margin="normal"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
          />
          <TextField
            label="Cédula" fullWidth margin="normal"
            value={form.cedula}
            onChange={e => setForm({ ...form, cedula: e.target.value })}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Rango</InputLabel>
            <Select value={form.rango} label="Rango"
              onChange={e => setForm({ ...form, rango: e.target.value })}>
              {RANGOS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>


          <TextField
  label="Antigüedad (número — 1 = más antiguo)"
  type="number"
  fullWidth
  margin="normal"
  inputProps={{ min: 1, max: 50 }}
  value={form.antiguedad}
  onChange={e => setForm({ ...form, antiguedad: parseInt(e.target.value) || '' })}
  helperText="Ejemplo: 1 = más antiguo en su rango, 2 = segundo más antiguo"
/>

          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de personal</InputLabel>
            <Select value={form.tipoPersonal} label="Tipo de personal"
              onChange={e => setForm({ ...form, tipoPersonal: e.target.value, grupoOperativo: '', grupoEcu: '' })}>
              {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>

          {form.tipoPersonal === 'OPERATIVO' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Grupo operativo</InputLabel>
              <Select value={form.grupoOperativo} label="Grupo operativo"
                onChange={e => setForm({ ...form, grupoOperativo: e.target.value })}>
                {GRUPOS_OPERATIVOS.map(g => <MenuItem key={g} value={g}>{g.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          {form.tipoPersonal === 'ECU' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Grupo ECU</InputLabel>
              <Select value={form.grupoEcu} label="Grupo ECU"
                onChange={e => setForm({ ...form, grupoEcu: e.target.value })}>
                {GRUPOS_ECU.map(g => <MenuItem key={g} value={g}>{g.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Estación asignada</InputLabel>
            <Select value={form.estacionId} label="Estación asignada"
              onChange={e => setForm({ ...form, estacionId: e.target.value })}>
              <MenuItem value="">Sin asignar</MenuItem>
              {estaciones.map(est => (
                <MenuItem key={est.id} value={est.id}>{est.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
  control={
    <Switch
      checked={Boolean(form.esParamedico)}
      onChange={e => setForm({ ...form, esParamedico: e.target.checked })}
      color="error"
    />
  }
  label={
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2">Es paramédico</Typography>
      {form.esParamedico && (
        <Chip label="Paramédico" size="small"
          sx={{ bgcolor: '#ff69b4', color: 'white', fontSize: 10 }} />
      )}
    </Box>
  }
  sx={{ mt: 1 }}
/>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrar}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={guardar}>
            {editando ? 'Guardar cambios' : 'Crear empleado'}
          </Button>
        </DialogActions>
      </Dialog>
      <EmpleadoDetalle
  empleado={empleadoDetalle}
  onCerrar={() => setEmpleadoDetalle(null)}
  onActualizar={cargar}
/>
    </Box>
  )
}