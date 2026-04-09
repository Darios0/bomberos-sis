import { useState } from 'react'
import {
  Box, Typography, Button, Chip, Drawer, List,
  ListItem, ListItemButton, ListItemText, IconButton, Tooltip
} from '@mui/material'
import { useAuth } from '../context/AuthContext'
import Calendario  from './Calendario'
import Empleados   from './Empleados'
import Estaciones  from './Estaciones'
import Distributivo from './Distributivo'

const MENU = [
  { label: 'Calendario',   vista: 'calendario',   icono: '📅' },
  { label: 'Distributivo', vista: 'distributivo',  icono: '📋' },
  { label: 'Personal',     vista: 'empleados',     icono: '👨‍🚒' },
  { label: 'Estaciones',   vista: 'estaciones',    icono: '🏠' },
]

const SIDEBAR_ANCHO    = 200
const SIDEBAR_COLAPSADO = 56

export default function Dashboard() {
  const { usuario, logout } = useAuth()
  const [vista, setVista]         = useState('calendario')
  const [colapsado, setColapsado] = useState(false)

  const ancho = colapsado ? SIDEBAR_COLAPSADO : SIDEBAR_ANCHO

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <Box sx={{
        width: ancho,
        flexShrink: 0,
        bgcolor: '#b71c1c',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        overflow: 'hidden',
        zIndex: 10
      }}>
        {/* Header sidebar */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!colapsado && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" color="white" noWrap>
                🚒 Bomberos
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)" noWrap>
                {usuario?.nombre}
              </Typography>
              <br />
              <Chip
                label={usuario?.rol}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 0.5, fontSize: 10 }}
              />
            </Box>
          )}
          <IconButton
            onClick={() => setColapsado(c => !c)}
            sx={{ color: 'white', ml: colapsado ? 0 : 'auto' }}
            size="small"
          >
            {colapsado ? '▶' : '◀'}
          </IconButton>
        </Box>

        {/* Menú */}
        <List sx={{ flex: 1, pt: 0 }}>
          {MENU.map(item => (
            <ListItem key={item.vista} disablePadding>
              <Tooltip title={colapsado ? item.label : ''} placement="right">
                <ListItemButton
                  selected={vista === item.vista}
                  onClick={() => setVista(item.vista)}
                  sx={{
                    color: 'white',
                    px: colapsado ? 1.5 : 2,
                    justifyContent: colapsado ? 'center' : 'flex-start',
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <Typography fontSize={18} sx={{ mr: colapsado ? 0 : 1 }}>
                    {item.icono}
                  </Typography>
                  {!colapsado && <ListItemText primary={item.label} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>

        {/* Cerrar sesión */}
        <Box sx={{ p: 1.5 }}>
          <Tooltip title={colapsado ? 'Cerrar sesión' : ''} placement="right">
            <Button
              fullWidth
              variant="outlined"
              onClick={logout}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                minWidth: 0,
                px: colapsado ? 1 : 2,
                fontSize: colapsado ? 16 : 14
              }}
            >
              {colapsado ? '⏻' : 'Cerrar sesión'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Contenido principal */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {/* AppBar */}
        <Box sx={{
          bgcolor: '#c62828', color: 'white',
          px: 3, py: 1.5, flexShrink: 0,
          display: 'flex', alignItems: 'center'
        }}>
          <Typography variant="h6">
            {MENU.find(m => m.vista === vista)?.label || 'Sistema'}
          </Typography>
        </Box>

        {/* Vista activa — scroll independiente */}
        <Box sx={{
  flex: 1,
  overflow: 'auto',
  p: vista === 'distributivo' ? 2 : 3,
  bgcolor: '#fafafa'
}}>
          {vista === 'calendario'   && <Calendario />}
          {vista === 'distributivo' && <Distributivo />}
          {vista === 'empleados'    && <Empleados />}
          {vista === 'estaciones'   && <Estaciones />}
        </Box>
      </Box>
    </Box>
  )
}