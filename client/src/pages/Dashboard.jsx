import { useState } from 'react'
import { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemButton, ListItemText, Chip } from '@mui/material'
import { useAuth } from '../context/AuthContext'
import Empleados from './Empleados'
import Estaciones from './Estaciones'
import Calendario from './Calendario'

const MENU = [
  { label: 'Calendario',  vista: 'calendario' },
  { label: 'Personal',    vista: 'empleados' },
  { label: 'Estaciones',  vista: 'estaciones' },
]

export default function Dashboard() {
  const { usuario, logout } = useAuth()
  const [vista, setVista]   = useState('calendario')

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer variant="permanent" sx={{ width: 220, '& .MuiDrawer-paper': { width: 220, bgcolor: '#b71c1c' } }}>
        <Box sx={{ p: 2, color: 'white' }}>
          <Typography variant="h6" fontWeight="bold">🚒 Bomberos</Typography>
          <Typography variant="caption">{usuario?.nombre}</Typography>
          <br />
          <Chip label={usuario?.rol} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 0.5 }} />
        </Box>
        <List>
          {MENU.map(item => (
            <ListItem key={item.vista} disablePadding>
              <ListItemButton
                selected={vista === item.vista}
                onClick={() => setVista(item.vista)}
                sx={{ color: 'white', '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button fullWidth variant="outlined" sx={{ color: 'white', borderColor: 'white' }} onClick={logout}>
            Cerrar sesión
          </Button>
        </Box>
      </Drawer>

      {/* Contenido */}
      <Box component="main" sx={{ flexGrow: 1, p: 0, minHeight: '100vh', bgcolor: '#fafafa' }}>
        <AppBar position="static" sx={{ bgcolor: '#c62828' }}>
          <Toolbar>
            <Typography variant="h6">
              {MENU.find(m => m.vista === vista)?.label || 'Sistema'}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          {vista === 'empleados' && <Empleados />}
          {vista === 'estaciones' && <Estaciones />}
          {vista === 'calendario'  && <Calendario />}
        </Box>
      </Box>
    </Box>
  )
}