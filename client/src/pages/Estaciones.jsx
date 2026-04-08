import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  Box, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField,
  Typography, Alert, CircularProgress
} from '@mui/material'

const INICIAL = { nombre: '', direccion: '' }

export default function Estaciones() {
  const [estaciones, setEstaciones] = useState([])
  const [cargando, setCargando]     = useState(true)
  const [dialogo, setDialogo]       = useState(false)
  const [form, setForm]             = useState(INICIAL)
  const [editando, setEditando]     = useState(null)
  const [error, setError]           = useState('')

  const cargar = async () => {
    try {
      const res = await api.get('/estaciones')
      setEstaciones(res.data)
    } catch {
      setError('Error al cargar estaciones')
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

  const abrirEditar = (est) => {
    setEditando(est.id)
    setForm({ nombre: est.nombre, direccion: est.direccion || '' })
    setError('')
    setDialogo(true)
  }

  const cerrar = () => {
    setDialogo(false)
    setError('')
  }

  const guardar = async () => {
    if (!form.nombre) {
      setError('El nombre es requerido')
      return
    }
    try {
      if (editando) {
        await api.put(`/estaciones/${editando}`, form)
      } else {
        await api.post('/estaciones', form)
      }
      cerrar()
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  if (cargando) return <Box sx={{ p: 4 }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Estaciones — {estaciones.length} registradas
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={abrirCrear}>
          + Nueva estación
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>#</b></TableCell>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Dirección</b></TableCell>
              <TableCell><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estaciones.map((est, i) => (
              <TableRow key={est.id} hover>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{est.nombre}</TableCell>
                <TableCell>{est.direccion || '—'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => abrirEditar(est)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {estaciones.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No hay estaciones registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogo} onClose={cerrar} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar estación' : 'Nueva estación'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="Nombre de la estación"
            fullWidth margin="normal"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
          />
          <TextField
            label="Dirección"
            fullWidth margin="normal"
            value={form.direccion}
            onChange={e => setForm({ ...form, direccion: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrar}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={guardar}>
            {editando ? 'Guardar cambios' : 'Crear estación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}