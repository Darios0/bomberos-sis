import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel,
  MenuItem, Select, Alert, Box, Chip
} from '@mui/material'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useNotificaciones } from '../context/NotificacionesContext'

const URGENCIAS = [
  { value: 'NORMAL',     label: 'Normal',     color: '#1565c0' },
  { value: 'URGENTE',    label: 'Urgente',    color: '#e65100' },
  { value: 'EMERGENCIA', label: 'Emergencia', color: '#b71c1c' }
]

const DESTINATARIOS = [
  { value: 'TODOS',          label: 'Todo el personal' },
  { value: 'GRUPO_1',        label: 'Solo Grupo 1' },
  { value: 'GRUPO_2',        label: 'Solo Grupo 2' },
  { value: 'GRUPO_3',        label: 'Solo Grupo 3' },

]

export default function NuevaNotificacion({ open, onCerrar }) {
  const { usuario }  = useAuth()
  const { cargar, reproducirSonido } = useNotificaciones()
  const [form, setForm]     = useState({
    titulo: '', mensaje: '', urgencia: 'NORMAL', destinatario: 'TODOS'
  })
  const [error, setError]   = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    if (!form.titulo || !form.mensaje) {
      setError('El título y el mensaje son requeridos')
      return
    }
    setEnviando(true)
    try {
      await api.post('/notificaciones', { ...form, usuarioId: usuario.id })
      reproducirSonido(form.urgencia)
      setForm({ titulo: '', mensaje: '', urgencia: 'NORMAL', destinatario: 'TODOS' })
      setError('')
      cargar()
      onCerrar()
    } catch {
      setError('Error al enviar la notificación')
    } finally {
      setEnviando(false)
    }
  }

  const urgenciaActual = URGENCIAS.find(u => u.value === form.urgencia)

  return (
    <Dialog open={open} onClose={onCerrar} fullWidth maxWidth="sm">
      <DialogTitle>Nueva notificación</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormControl fullWidth margin="normal">
          <InputLabel>Nivel de urgencia</InputLabel>
          <Select value={form.urgencia} label="Nivel de urgencia"
            onChange={e => setForm({ ...form, urgencia: e.target.value })}>
            {URGENCIAS.map(u => (
              <MenuItem key={u.value} value={u.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: u.color }} />
                  {u.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Destinatarios</InputLabel>
          <Select value={form.destinatario} label="Destinatarios"
            onChange={e => setForm({ ...form, destinatario: e.target.value })}>
            {DESTINATARIOS.map(d => (
              <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Título" fullWidth margin="normal"
          value={form.titulo}
          onChange={e => setForm({ ...form, titulo: e.target.value })}
        />

        <TextField
          label="Mensaje" fullWidth multiline rows={4} margin="normal"
          value={form.mensaje}
          onChange={e => setForm({ ...form, mensaje: e.target.value })}
        />

        {form.destinatario !== 'TODOS' && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`Enviará a: ${DESTINATARIOS.find(d => d.value === form.destinatario)?.label}`}
              color="info" size="small"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="contained" sx={{ bgcolor: urgenciaActual?.color || '#c62828' }}
          onClick={enviar} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar notificación'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}