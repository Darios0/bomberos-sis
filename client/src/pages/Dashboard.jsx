import { Box, Typography, Button, Chip } from '@mui/material'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { usuario, logout } = useAuth()

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Bienvenido, {usuario?.nombre}
      </Typography>
      <Chip
        label={usuario?.rol}
        color="error"
        sx={{ mb: 3 }}
      />
      <br />
      <Button variant="outlined" color="error" onClick={logout}>
        Cerrar sesión
      </Button>
    </Box>
  )
}