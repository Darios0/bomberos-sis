import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const NotificacionesContext = createContext()

export function NotificacionesProvider({ children }) {
  const { usuario } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas, setNoLeidas]             = useState(0)
  const prevCount = useRef(-1)

  const reproducirSonido = (urgencia) => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (urgencia === 'EMERGENCIA') {
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
        const osc2  = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.4)
        gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.4)
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
        osc2.start(ctx.currentTime + 0.4)
        osc2.stop(ctx.currentTime + 0.7)
      } else if (urgencia === 'URGENTE') {
        osc.frequency.setValueAtTime(660, ctx.currentTime)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch (e) {
      console.warn('Error reproduciendo sonido:', e)
    }
  }

  const cargar = useCallback(async () => {
    if (!usuario?.id) return
    try {
      const res  = await api.get(`/notificaciones?usuarioId=${usuario.id}`)
      const data = res.data
      const noLeidasCount = data.filter(n => !n.leida).length

      setNotificaciones(data)
      setNoLeidas(noLeidasCount)

      if (prevCount.current >= 0 && noLeidasCount > prevCount.current) {
        const nueva = data.find(n => !n.leida)
        reproducirSonido(nueva?.urgencia || 'NORMAL')
      }
      prevCount.current = noLeidasCount
    } catch (e) {
      console.warn('Error cargando notificaciones:', e)
    }
  }, [usuario?.id])

  // Cargar al iniciar sesión
  useEffect(() => {
    if (!usuario?.id) return
    prevCount.current = -1
    cargar()
  }, [usuario?.id])

  // Sonido si hay no leídas al abrir sesión
  useEffect(() => {
    if (noLeidas > 0 && prevCount.current === -1) {
      const timer = setTimeout(() => {
        const primera = notificaciones.find(n => !n.leida)
        reproducirSonido(primera?.urgencia || 'NORMAL')
        prevCount.current = noLeidas
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [noLeidas])

  // Polling cada 30 segundos
  useEffect(() => {
    if (!usuario?.id) return
    const intervalo = setInterval(cargar, 30000)
    return () => clearInterval(intervalo)
  }, [usuario?.id, cargar])

  const marcarLeida = async (id) => {
    try {
      await api.post(`/notificaciones/${id}/leer`, { usuarioId: usuario.id })
      await cargar()
    } catch (e) {
      console.warn('Error marcando leída:', e)
    }
  }

  const marcarTodasLeidas = async () => {
    try {
      await api.post('/notificaciones/leer-todas', { usuarioId: usuario.id })
      await cargar()
    } catch (e) {
      console.warn('Error marcando todas leídas:', e)
    }
  }

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      cargar,
      marcarLeida,
      marcarTodasLeidas,
      reproducirSonido
    }}>
      {children}
    </NotificacionesContext.Provider>
  )
}

export function useNotificaciones() {
  return useContext(NotificacionesContext)
}