import { useState } from 'react'
import {
  Badge, Box, Button, Chip, Divider, IconButton,
  Popover, Typography, Tooltip, Dialog, DialogTitle,
  DialogContent, List, ListItem, ListItemText, DialogActions
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useNotificaciones } from '../context/NotificacionesContext'
import { useAuth } from '../context/AuthContext'
import NuevaNotificacion from './NuevaNotificacion'
import api from '../api/axios'

const COLOR_URGENCIA = {
  NORMAL:     { bg: '#e3f2fd', border: '#1565c0', chip: 'primary'  },
  URGENTE:    { bg: '#fff3e0', border: '#e65100', chip: 'warning'  },
  EMERGENCIA: { bg: '#ffebee', border: '#b71c1c', chip: 'error'    }
}

const LABEL_DESTINATARIO = {
  TODOS: 'Todos', GRUPO_1: 'Grupo 1', GRUPO_2: 'Grupo 2',
  GRUPO_3: 'Grupo 3', GRUPO_1_2: 'Grupo 1 y 2',
  GRUPO_1_3: 'Grupo 1 y 3', GRUPO_2_3: 'Grupo 2 y 3',
  ECU: 'ECU', ADMINISTRATIVO: 'Administrativos', OPERADORES: 'Operativos'
}

export default function CampanaNotificaciones() {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones()
  const { usuario } = useAuth()
  const puedeCrear  = ['ADMIN', 'OPERADOR'].includes(usuario?.rol)

  const [anchorEl, setAnchorEl]         = useState(null)
  const [dialogoNueva, setDialogoNueva] = useState(false)
  const [notifDetalle, setNotifDetalle] = useState(null)
  const [lecturas, setLecturas]         = useState(null)
  const [cargandoLect, setCargandoLect] = useState(false)

  const abrir  = (e) => setAnchorEl(e.currentTarget)
  const cerrar = ()  => setAnchorEl(null)

  const verDetalle = async (n) => {
    setNotifDetalle(n)
    setCargandoLect(true)
    try {
      const res = await api.get(`/notificaciones/${n.id}/lecturas`)
      setLecturas(res.data)
    } catch {
      setLecturas(null)
    } finally {
      setCargandoLect(false)
    }
  }

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton onClick={abrir} sx={{ color: 'white' }}>
          <Badge badgeContent={noLeidas} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={cerrar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 400, maxHeight: 560, display: 'flex', flexDirection: 'column' } }}
      >
        {/* Encabezado */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notificaciones {noLeidas > 0 && `(${noLeidas} nuevas)`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {noLeidas > 0 && (
              <Button size="small" onClick={marcarTodasLeidas}>Todas leídas</Button>
            )}
            {puedeCrear && (
              <Button size="small" variant="contained" sx={{ bgcolor: '#c62828' }}
                onClick={() => { cerrar(); setDialogoNueva(true) }}>
                + Nueva
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Lista */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {notificaciones.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No hay notificaciones
            </Typography>
          )}
          {notificaciones.map(n => {
            const colores = COLOR_URGENCIA[n.urgencia] || COLOR_URGENCIA.NORMAL
            return (
              <Box key={n.id} sx={{
                p: 1.5,
                borderLeft: `4px solid ${colores.border}`,
                bgcolor: n.leida ? 'transparent' : colores.bg,
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.2s'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {!n.leida && (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colores.border, flexShrink: 0 }} />
                    )}
                    <Typography variant="body2" fontWeight={n.leida ? 400 : 600}>
                      {n.titulo}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip label={n.urgencia} size="small" color={colores.chip} sx={{ fontSize: 9, height: 18 }} />
                    <Chip
                      label={LABEL_DESTINATARIO[n.destinatario] || 'Todos'}
                      size="small" variant="outlined"
                      sx={{ fontSize: 9, height: 18 }}
                    />
                  </Box>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block">
                  {n.mensaje}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(n.creadoEn).toLocaleDateString('es-EC', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                    {n.leida && n.leidoEn && ` · Leída ${new Date(n.leidoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {!n.leida && (
                      <Button size="small" sx={{ fontSize: 10, py: 0 }} onClick={() => marcarLeida(n.id)}>
                        Marcar leída
                      </Button>
                    )}
                    {puedeCrear && (
                      <Button size="small" sx={{ fontSize: 10, py: 0 }} onClick={() => { cerrar(); verDetalle(n) }}>
                        Ver lecturas
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Popover>

      {/* Dialogo nueva notificación */}
      <NuevaNotificacion open={dialogoNueva} onCerrar={() => setDialogoNueva(false)} />

      {/* Dialogo detalle de lecturas */}
      <Dialog open={!!notifDetalle} onClose={() => { setNotifDetalle(null); setLecturas(null) }}
        fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6">{notifDetalle?.titulo}</Typography>
          <Typography variant="caption" color="text.secondary">{notifDetalle?.mensaje}</Typography>
        </DialogTitle>
        <DialogContent>
          {cargandoLect && <Typography>Cargando...</Typography>}
          {lecturas && (
            <>
              <Box sx={{ mb: 2 }}>
                <Chip label={`${lecturas.leyeron.length} leyeron`} color="success" size="small" sx={{ mr: 1 }} />
                <Chip label={`${lecturas.noLeyeron.length} no han leído`} color="error" size="small" />
                <Chip label={`Total: ${lecturas.total}`} size="small" sx={{ ml: 1 }} />
              </Box>

              {lecturas.leyeron.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" color="success.main" mb={0.5}>
                    Leyeron
                  </Typography>
                  <List dense sx={{ mb: 2 }}>
                    {lecturas.leyeron.map(l => (
                      <ListItem key={l.usuarioId} sx={{ py: 0.5, px: 0 }}>
                        <ListItemText
                          primary={l.usuario?.nombre || 'Usuario'}
                          secondary={`${l.usuario?.rol} · Leído el ${new Date(l.leidoEn).toLocaleDateString('es-EC', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {lecturas.noLeyeron.length > 0 && (
                <>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold" color="error.main" mb={0.5}>
                    Pendientes de leer
                  </Typography>
                  <List dense>
                    {lecturas.noLeyeron.map(l => (
                      <ListItem key={l.usuarioId} sx={{ py: 0.5, px: 0 }}>
                        <ListItemText
                          primary={l.usuario?.nombre || 'Usuario'}
                          secondary={l.usuario?.rol}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setNotifDetalle(null); setLecturas(null) }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}