import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useProviderLocation(providerId: string | undefined, isOnline: boolean) {
  const watchIdRef  = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCoords  = useRef<GeolocationCoordinates | null>(null)

  const pushLocation = useCallback(async (coords: GeolocationCoordinates) => {
    if (!providerId) return
    // Only send lat/lng/updated_at — avoids column-not-found errors
    const { error } = await supabase
      .from('provider_locations')
      .upsert({
        provider_id: providerId,
        latitude:    coords.latitude,
        longitude:   coords.longitude,
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'provider_id' })
    if (error) console.warn('Location push:', error.message)
  }, [providerId])

  useEffect(() => {
    if (!providerId || !isOnline) {
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

    if (!navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => { lastCoords.current = pos.coords; pushLocation(pos.coords) },
      err => console.warn('GPS:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    intervalRef.current = setInterval(() => {
      if (lastCoords.current) pushLocation(lastCoords.current)
    }, 5000)

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [providerId, isOnline, pushLocation])
}
