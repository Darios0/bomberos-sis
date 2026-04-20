import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem,
  Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Alert, Tabs, Tab, Badge
} from '@mui/material'

const ROLES = [
  { value: 'ADMIN',        label: 'Administrador', color: 'error'   },
  { value: 'OPERADOR',     label: 'Operador',       color: 'warning' },
  { value: 'EVALUADOR',    label: 'Evaluador',      color: 'info'    },
  { value: 'VISUALIZADOR', label: 'Visualizador',   color: 'default' }
]

const DOMINIO = '@bomberosibarra.gob.ec'
const INICIAL  = { nombre: '', email: '', password: '', rol: 'VISUALIZADOR', activo: true }

export default function Usuarios() {
  const { usuario: usuarioActual } = useAuth()
  const [usuarios, setUsuarios]     = useState([])
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando]     = useState(true)
  const [tab, setTab]               = useState(0)
  const [dialogo, setDialogo]       = useState(false)
  const [dialogoPass, setDialogoPass] = useState(false)
  const [form, setForm]             = useState(INICIAL)
  const [formPass, setFormPass]     = useState({ passwordNueva: '', confirmar: '' })
  const [editando, setEditando]     = useState(null)
  const [error, setError]           = useState('')
  const [errorPass, setErrorPass]   = useState('')
  const [exito, setExito]           = useState('')
  const [busqueda, setBusqueda]     = useState('')

  const cargar = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/usuarios/pendientes')
      ])
      setUsuarios(uRes.data.filter(u => u.aprobado))
      setPendientes(pRes.data)
    } catch {
      setError('Error al cargar usuarios')
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

  const abrirEditar = (u) => {
    setEditando(u.id)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, activo: u.activo })
    setError('')
    setDialogo(true)
  }

  const abrirCambiarPass = (u) => {
    setEditando(u.id)
    setFormPass({ passwordNueva: '', confirmar: '' })
    setErrorPass('')
    setDialogoPass(true)
  }

  const cerrar     = () => { setDialogo(false);     setError('') }
  const cerrarPass = () => { setDialogoPass(false); setErrorPass('') }

  const mostrarExito = (msg) => {
    setExito(msg)
    setTimeout(() => setExito(''), 3000)
  }

  const guardar = async () => {
    if (!form.nombre || !form.email || !form.rol) {
      setError('Nombre, correo y rol son requeridos')
      return
    }
    if (!form.email.endsWith(DOMINIO)) {
      setError(`El correo debe terminar en ${DOMINIO}`)
      return
    }
    if (!editando && !form.password) {
      setError('La contraseña es requerida para nuevos usuarios')
      return
    }
    try {
      if (editando) {
        const data = { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo }
        if (form.password) data.password = form.password
        await api.put(`/usuarios/${editando}`, data)
        mostrarExito('Usuario actualizado')
      } else {
        await api.post('/usuarios', form)
        mostrarExito('Usuario creado correctamente')
      }
      cerrar()
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const cambiarPassword = async () => {
    if (!formPass.passwordNueva || !formPass.confirmar) {
      setErrorPass('Completa todos los campos')
      return
    }
    if (formPass.passwordNueva !== formPass.confirmar) {
      setErrorPass('Las contraseñas no coinciden')
      return
    }
    if (formPass.passwordNueva.length < 6) {
      setErrorPass('Mínimo 6 caracteres')
      return
    }
    try {
      await api.put(`/usuarios/${editando}`, { password: formPass.passwordNueva })
      mostrarExito('Contraseña actualizada')
      cerrarPass()
    } catch (err) {
      setErrorPass(err.response?.data?.error || 'Error al cambiar contraseña')
    }
  }

  const aprobar = async (u) => {
    try {
      await api.post(`/usuarios/${u.id}/aprobar`)
      mostrarExito(`${u.nombre} aprobado correctamente`)
      cargar()
    } catch {
      setError('Error al aprobar usuario')
    }
  }

  const rechazar = async (u) => {
    if (!confirm(`¿Rechazar y eliminar la solicitud de ${u.nombre}?`)) return
    try {
      await api.post(`/usuarios/${u.id}/rechazar`)
      mostrarExito('Solicitud rechazada')
      cargar()
    } catch {
      setError('Error al rechazar solicitud')
    }
  }

  const toggleActivo = async (u) => {
    if (!confirm(`¿${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre}?`)) return
    try {
      await api.put(`/usuarios/${u.id}`, { activo: !u.activo })
      cargar()
    } catch {
      setError('Error al actualizar estado')
    }
  }

  const cambiarRol = async (u, nuevoRol) => {
    try {
      await api.put(`/usuarios/${u.id}`, { rol: nuevoRol })
      mostrarExito(`Rol actualizado a ${nuevoRol}`)
      cargar()
    } catch {
      setError('Error al cambiar rol')
    }
  }

  const filtrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const getRolInfo = (rol) => ROLES.find(r => r.value === rol) || ROLES[3]
  const totalUsuarios = usuarios.length

  if (cargando) return <Box sx={{ p: 4 }}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Usuarios — {totalUsuarios} / 150
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={abrirCrear}>
          + Nuevo usuario
        </Button>
      </Box>

      {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}
      {error && !dialogo && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Barra de capacidad */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Capacidad del sistema
          </Typography>
          <Typography variant="caption" color={totalUsuarios >= 140 ? 'error' : 'text.secondary'}>
            {totalUsuarios} / 150 usuarios
          </Typography>
        </Box>
        <Box sx={{ height: 6, bgcolor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{
            height: '100%',
            width: `${(totalUsuarios / 150) * 100}%`,
            bgcolor: totalUsuarios >= 140 ? '#c62828' : totalUsuarios >= 120 ? '#f57c00' : '#2e7d32',
            borderRadius: 3, transition: 'width 0.3s'
          }} />
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Usuarios activos" />
        <Tab label={
          <Badge badgeContent={pendientes.length} color="error">
            <Box sx={{ pr: pendientes.length > 0 ? 2 : 0 }}>Pendientes de aprobación</Box>
          </Badge>
        } />
      </Tabs>

      {/* Tab usuarios activos */}
      {tab === 0 && (
        <>
          <TextField
            placeholder="Buscar por nombre o correo..."
            fullWidth size="small" sx={{ mb: 2 }}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><b>Nombre</b></TableCell>
                  <TableCell><b>Correo</b></TableCell>
                  <TableCell><b>Rol</b></TableCell>
                  <TableCell><b>Estado</b></TableCell>
                  <TableCell><b>Creado</b></TableCell>
                  <TableCell><b>Acciones</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrados.map(u => {
                  const rolInfo = getRolInfo(u.rol)
                  const esYo    = u.id === usuarioActual?.id
                  return (
                    <TableRow key={u.id} hover sx={{ opacity: u.activo ? 1 : 0.6 }}>
                      <TableCell>
                        {u.nombre}
                        {esYo && <Chip label="Tú" size="small" sx={{ ml: 1, fontSize: 9, height: 16 }} />}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.rol} size="small" variant="standard"
                          disabled={esYo}
                          onChange={e => cambiarRol(u, e.target.value)}
                          sx={{ fontSize: 12 }}
                        >
                          {ROLES.map(r => (
                            <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.activo ? 'Activo' : 'Inactivo'}
                          color={u.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(u.creadoEn).toLocaleDateString('es-EC')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => abrirEditar(u)}>Editar</Button>
                        <Button size="small" color="info" onClick={() => abrirCambiarPass(u)}>
                          Clave
                        </Button>
                        {!esYo && (
                          <Button size="small"
                            color={u.activo ? 'error' : 'success'}
                            onClick={() => toggleActivo(u)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab pendientes */}
      {tab === 1 && (
        <Box>
          {pendientes.length === 0 && (
            <Alert severity="success">No hay solicitudes pendientes de aprobación</Alert>
          )}
          {pendientes.map(u => (
            <Paper key={u.id} sx={{ p: 2, mb: 1.5, border: '1px solid', borderColor: 'warning.light' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body1" fontWeight="bold">{u.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    Solicitó acceso el {new Date(u.creadoEn).toLocaleDateString('es-EC', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Rol a asignar</InputLabel>
                    <Select
                      defaultValue="VISUALIZADOR"
                      label="Rol a asignar"
                      onChange={e => {
                        u._rolSeleccionado = e.target.value
                      }}
                    >
                      {ROLES.map(r => (
                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained" color="success" size="small"
                    onClick={() => aprobar(u)}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="outlined" color="error" size="small"
                    onClick={() => rechazar(u)}
                  >
                    Rechazar
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialogo crear/editar */}
      <Dialog open={dialogo} onClose={cerrar} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="Nombre completo" fullWidth margin="normal"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
          />
          <TextField
            label="Correo institucional" fullWidth margin="normal"
            placeholder={`nombre${DOMINIO}`}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            helperText={`Debe terminar en ${DOMINIO}`}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select value={form.rol} label="Rol"
              onChange={e => setForm({ ...form, rol: e.target.value })}>
              {ROLES.map(r => (
                <MenuItem key={r.value} value={r.value}>
                  <Chip label={r.label} color={r.color} size="small" sx={{ mr: 1 }} />
                  {r.value === 'ADMIN'        && '— Control total'}
                  {r.value === 'OPERADOR'     && '— Edita distributivo y personal'}
                  {r.value === 'EVALUADOR'    && '— Registra ausencias y méritos'}
                  {r.value === 'VISUALIZADOR' && '— Solo lectura'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={editando ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña'}
            type="password" fullWidth margin="normal"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          {editando && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Estado</InputLabel>
              <Select value={form.activo} label="Estado"
                onChange={e => setForm({ ...form, activo: e.target.value })}>
                <MenuItem value={true}>Activo</MenuItem>
                <MenuItem value={false}>Inactivo</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrar}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={guardar}>
            {editando ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo contraseña */}
      <Dialog open={dialogoPass} onClose={cerrarPass} fullWidth maxWidth="xs">
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogContent>
          {errorPass && <Alert severity="error" sx={{ mb: 2 }}>{errorPass}</Alert>}
          <TextField
            label="Nueva contraseña" type="password" fullWidth margin="normal"
            value={formPass.passwordNueva}
            onChange={e => setFormPass({ ...formPass, passwordNueva: e.target.value })}
          />
          <TextField
            label="Confirmar contraseña" type="password" fullWidth margin="normal"
            value={formPass.confirmar}
            onChange={e => setFormPass({ ...formPass, confirmar: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarPass}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={cambiarPassword}>
            Cambiar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}