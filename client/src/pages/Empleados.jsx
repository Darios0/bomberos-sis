import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem,
  Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Alert
} from '@mui/material'

const RANGOS  = ['Bombero', 'Cabo', 'Sargento', 'Teniente', 'Capitán', 'Mayor', 'Coronel']
const GRUPOS  = ['GRUPO_1', 'GRUPO_2', 'GRUPO_3']
const INICIAL = { nombre: '', cedula: '', rango: '', grupo: '' }

export default function Empleados() {
  const [empleados, setEmpleados]   = useState([])
  const [cargando, setCargando]     = useState(true)
  const [dialogo, setDialogo]       = useState(false)
  const [form, setForm]             = useState(INICIAL)
  const [editando, setEditando]     = useState(null)
  const [error, setError]           = useState('')
  const [busqueda, setBusqueda]     = useState('')

  const cargarEmpleados = async () => {
    try {
      const res = await api.get('/empleados')
      setEmpleados(res.data)
    } catch {
      setError('Error al cargar empleados')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarEmpleados() }, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(INICIAL)
    setError('')
    setDialogo(true)
  }

  const abrirEditar = (emp) => {
    setEditando(emp.id)
    setForm({ nombre: emp.nombre, cedula: emp.cedula, rango: emp.rango, grupo: emp.grupo })
    setError('')
    setDialogo(true)
  }

  const cerrar = () => {
    setDialogo(false)
    setError('')
  }

  const guardar = async () => {
    if (!form.nombre || !form.cedula || !form.rango || !form.grupo) {
      setError('Todos los campos son requeridos')
      return
    }
    try {
      if (editando) {
        await api.put(`/empleados/${editando}`, form)
      } else {
        await api.post('/empleados', form)
      }
      cerrar()
      cargarEmpleados()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const desactivar = async (id) => {
    if (!confirm('¿Desactivar este empleado?')) return
    await api.delete(`/empleados/${id}`)
    cargarEmpleados()
  }

  const filtrados = empleados.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.cedula.includes(busqueda)
  )

  const colorGrupo = { GRUPO_1: 'error', GRUPO_2: 'primary', GRUPO_3: 'success' }

  if (cargando) return <Box sx={{ p: 4 }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Personal — {empleados.length} bomberos</Typography>
        <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={abrirCrear}>
          + Nuevo empleado
        </Button>
      </Box>

      <TextField
        placeholder="Buscar por nombre o cédula..."
        fullWidth
        size="small"
        sx={{ mb: 2 }}
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Cédula</b></TableCell>
              <TableCell><b>Rango</b></TableCell>
              <TableCell><b>Grupo</b></TableCell>
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
                  <Chip
                    label={emp.grupo.replace('_', ' ')}
                    color={colorGrupo[emp.grupo]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={emp.activo ? 'Activo' : 'Inactivo'}
                    color={emp.activo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => abrirEditar(emp)}>Editar</Button>
                  {emp.activo && (
                    <Button size="small" color="error" onClick={() => desactivar(emp.id)}>
                      Desactivar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
            label="Nombre completo"
            fullWidth margin="normal"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
          />
          <TextField
            label="Cédula"
            fullWidth margin="normal"
            value={form.cedula}
            onChange={e => setForm({ ...form, cedula: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rango</InputLabel>
            <Select value={form.rango} label="Rango" onChange={e => setForm({ ...form, rango: e.target.value })}>
              {RANGOS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Grupo</InputLabel>
            <Select value={form.grupo} label="Grupo" onChange={e => setForm({ ...form, grupo: e.target.value })}>
              {GRUPOS.map(g => <MenuItem key={g} value={g}>{g.replace('_', ' ')}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrar}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={guardar}>
            {editando ? 'Guardar cambios' : 'Crear empleado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}