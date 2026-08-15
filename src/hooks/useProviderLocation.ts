// Hook: runs on provider side when Online
// Continuously sends GPS to Supabase every 5 seconds
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useProviderLocation(providerId: string | undefined, isOnline: boolean) {
  const watchIdRef   = useRef<number | null>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCoords   = useRef<GeolocationCoordinates | null>(null)

  const pushLocation = useCallback(async (coords: GeolocationCoordinates) => {
    if (!providerId) return
    const { error } = await supabase
      .from('provider_locations')
      .upsert({
        provider_id: providerId,
        latitude:    coords.latitude,
        longitude:   coords.longitude,
        heading:     coords.heading  ?? 0,
        speed:       coords.speed    ? coords.speed * 3.6 : 0, // m/s → km/h
        accuracy:    coords.accuracy ?? 0,
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'provider_id' })
    if (error) console.error('Location push failed:', error.message)
  }, [providerId])

  useEffect(() => {
    if (!providerId || !isOnline) {
      // Clear watches when offline
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      return
    }

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastCoords.current = pos.coords
        pushLocation(pos.coords)
      },
      (err) => console.warn('GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    // Also push every 5s in case watch fires infrequently
    intervalRef.current = setInterval(() => {
      if (lastCoords.current) pushLocation(lastCoords.current)
    }, 5000)

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [providerId, isOnline, pushLocation])
}
