import { useAuth } from '../context/AuthContext'

export function usePermisos() {
  const { usuario } = useAuth()
  const rol = usuario?.rol

  return {
    esAdmin:       rol === 'ADMIN',
    esOperador:    rol === 'OPERADOR',
    esEvaluador:   rol === 'EVALUADOR',
    esVisualizador: rol === 'VISUALIZADOR',
    puedeEditarDistributivo: ['ADMIN', 'OPERADOR'].includes(rol),
    puedeGestionarPersonal:  ['ADMIN', 'OPERADOR'].includes(rol),
    puedeRegistrarAusencias: ['ADMIN', 'OPERADOR', 'EVALUADOR'].includes(rol),
    puedeVerUsuarios:        rol === 'ADMIN',
    puedeEnviarNotificaciones: ['ADMIN', 'OPERADOR', 'EVALUADOR'].includes(rol),
    puedeGestionarEstaciones:  ['ADMIN', 'OPERADOR', ].includes(rol),
  }
}