import { useState } from 'react'
import {
  Box, Typography, Button, Chip, Drawer, List,
  ListItem, ListItemButton, ListItemText, IconButton,
  Tooltip, useMediaQuery, useTheme, AppBar, Toolbar
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '../context/AuthContext'
import { NotificacionesProvider } from '../context/NotificacionesContext'
import CampanaNotificaciones from '../components/CampanaNotificaciones'
import Calendario   from './Calendario'
import Empleados    from './Empleados'
import Estaciones   from './Estaciones'
import Distributivo from './Distributivo'
import Reemplazos   from './Reemplazos'
import Reportes     from './Reportes'
import Usuarios     from './Usuarios'
import Perfil       from './Perfil'
import DashboardHome from './DashboardHome'

const MENU = [
  { label: 'Inicio',       vista: 'inicio',       icono: '🏠', roles: null },
  { label: 'Calendario',   vista: 'calendario',   icono: '📅', roles: null },
  { label: 'Distributivo', vista: 'distributivo',  icono: '📋', roles: null },
  { label: 'Reemplazos',   vista: 'reemplazos',    icono: '🔄', roles: ['ADMIN','OPERADOR','EVALUADOR'] },
  { label: 'Personal',     vista: 'empleados',     icono: '👨‍🚒', roles: ['ADMIN','OPERADOR','EVALUADOR'] },
  { label: 'Estaciones',   vista: 'estaciones',    icono: '🏠', roles: ['ADMIN'] },
  { label: 'Reportes',     vista: 'reportes',      icono: '📊', roles: ['ADMIN','OPERADOR','EVALUADOR'] },
  { label: 'Usuarios',     vista: 'usuarios',      icono: '👤', roles: ['ADMIN'] },
]

const SIDEBAR_ANCHO    = 200
const SIDEBAR_COLAPSADO = 56

export default function Dashboard() {
  const { usuario, logout } = useAuth()
  const theme    = useTheme()
  const esMobil  = useMediaQuery(theme.breakpoints.down('md'))

  const [vista, setVista]         = useState('inicio')
  const [colapsado, setColapsado] = useState(false)
  const [drawerMovil, setDrawerMovil] = useState(false)

  const menuFiltrado = MENU.filter(item =>
    !item.roles || item.roles.includes(usuario?.rol)
  )

  const ancho = colapsado ? SIDEBAR_COLAPSADO : SIDEBAR_ANCHO

  const handleVista = (v) => {
    setVista(v)
    if (esMobil) setDrawerMovil(false)
  }

  const ContenidoSidebar = () => (
    <Box sx={{
      width: esMobil ? 240 : ancho,
      bgcolor: '#b71c1c',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.2s',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {(!colapsado || esMobil) && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" color="white" noWrap>
              🚒 Bomberos
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.7)" noWrap>
              {usuario?.nombre}
            </Typography>
            <br />
            <Chip label={usuario?.rol} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 0.5, fontSize: 10 }} />
          </Box>
        )}
        {!esMobil && (
          <IconButton onClick={() => setColapsado(c => !c)}
            sx={{ color: 'white', ml: colapsado ? 0 : 'auto' }} size="small">
            {colapsado ? '▶' : '◀'}
          </IconButton>
        )}
      </Box>

      {/* Menú */}
      <List sx={{ flex: 1, pt: 0 }}>
        {menuFiltrado.map(item => (
          <ListItem key={item.vista} disablePadding>
            <Tooltip title={colapsado && !esMobil ? item.label : ''} placement="right">
              <ListItemButton
                selected={vista === item.vista}
                onClick={() => handleVista(item.vista)}
                sx={{
                  color: 'white',
                  px: colapsado && !esMobil ? 1.5 : 2,
                  justifyContent: colapsado && !esMobil ? 'center' : 'flex-start',
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <Typography fontSize={18} sx={{ mr: colapsado && !esMobil ? 0 : 1 }}>
                  {item.icono}
                </Typography>
                {(!colapsado || esMobil) && <ListItemText primary={item.label} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Perfil */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <ListItemButton
          selected={vista === 'perfil'}
          onClick={() => handleVista('perfil')}
          sx={{
            color: 'white', borderRadius: 1,
            px: colapsado && !esMobil ? 1.5 : 2,
            justifyContent: colapsado && !esMobil ? 'center' : 'flex-start',
            '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <Typography fontSize={18} sx={{ mr: colapsado && !esMobil ? 0 : 1 }}>👤</Typography>
          {(!colapsado || esMobil) && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" display="block" noWrap color="white" fontWeight={500}>
                {usuario?.nombre}
              </Typography>
              <Typography variant="caption" display="block" noWrap
                sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                Mi perfil
              </Typography>
            </Box>
          )}
        </ListItemButton>
      </Box>

      {/* Cerrar sesión */}
      <Box sx={{ p: 1.5 }}>
        <Button fullWidth variant="outlined" onClick={logout}
          sx={{
            color: 'white', borderColor: 'rgba(255,255,255,0.5)',
            minWidth: 0, px: colapsado && !esMobil ? 1 : 2,
            fontSize: colapsado && !esMobil ? 16 : 14
          }}>
          {colapsado && !esMobil ? '⏻' : 'Cerrar sesión'}
        </Button>
      </Box>
    </Box>
  )

  return (
    <NotificacionesProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Sidebar desktop */}
        {!esMobil && (
          <Box sx={{ width: ancho, flexShrink: 0, transition: 'width 0.2s' }}>
            <ContenidoSidebar />
          </Box>
        )}

        {/* Drawer móvil */}
        {esMobil && (
          <Drawer
            open={drawerMovil}
            onClose={() => setDrawerMovil(false)}
            PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
          >
            <ContenidoSidebar />
          </Drawer>
        )}

        {/* Contenido principal */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* AppBar */}
          <AppBar position="static" sx={{ bgcolor: '#c62828', flexShrink: 0 }}>
            <Toolbar variant="dense" sx={{ minHeight: 48 }}>
              {esMobil && (
                <IconButton color="inherit" onClick={() => setDrawerMovil(true)} sx={{ mr: 1 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ flex: 1, fontSize: esMobil ? 14 : 18 }}>
                {MENU.find(m => m.vista === vista)?.label || 'Mi perfil'}
              </Typography>
              <CampanaNotificaciones />
            </Toolbar>
          </AppBar>

          {/* Vista activa */}
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            p: esMobil ? 1 : vista === 'distributivo' ? 2 : 3,
            bgcolor: '#fafafa'
          }}>
            {vista === 'inicio'       && <DashboardHome />}
            {vista === 'calendario'   && <Calendario />}
            {vista === 'distributivo' && <Distributivo />}
            {vista === 'reemplazos'   && <Reemplazos />}
            {vista === 'empleados'    && <Empleados />}
            {vista === 'estaciones'   && <Estaciones />}
            {vista === 'reportes'     && <Reportes />}
            {vista === 'usuarios'     && <Usuarios />}
            {vista === 'perfil'       && <Perfil />}
          </Box>
        </Box>
      </Box>
    </NotificacionesProvider>
  )
}