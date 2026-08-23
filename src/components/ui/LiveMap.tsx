// Leaflet-based live map component
// Shows provider pin + customer pin + route
import { useEffect, useRef } from 'react'

interface Coords { lat: number; lng: number }

interface LiveMapProps {
  providerCoords?:  Coords | null
  customerCoords?:  Coords | null
  providerName?:    string
  customerName?:    string
  status?:          string
  height?:          number
}

export default function LiveMap({
  providerCoords, customerCoords,
  providerName = 'Provider', customerName = 'You',
  status = 'pending', height = 280
}: LiveMapProps) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const markersRef = useRef<{provider?: any; customer?: any; route?: any}>({})
  const routeRequestRef = useRef(0)

  useEffect(() => {
    if (!mapRef.current) return

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      // Add CSS if not present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id   = 'leaflet-css'
        link.rel  = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Load JS
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }

      const L = (window as any).L
      if (!leafletRef.current && mapRef.current) {
        // Center on Karnataka if no coords
        const center = providerCoords ?? customerCoords ?? { lat: 15.3173, lng: 75.7139 }
        const map = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom:   14,
          zoomControl: false,
          attributionControl: true,
        })

        // Light map theme keeps the route and location cards readable.
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)
        leafletRef.current = map
        window.setTimeout(() => map.invalidateSize(), 0)
      }
    }

    loadLeaflet()
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
        markersRef.current = {}
      }
    }
  }, []) // eslint-disable-line

  // Update markers when coords change
  useEffect(() => {
    const L = (window as any).L
    const map = leafletRef.current
    if (!L || !map) return

    // Provider marker
    if (providerCoords) {
      const provIcon = L.divIcon({
        html: `<div style="background:linear-gradient(135deg,#f97316,#ea580c);width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid #fff;box-shadow:0 2px 12px rgba(249,115,22,0.7)">🛵</div>`,
        className: '',
        iconSize:   [44, 44],
        iconAnchor: [22, 22],
      })
      if (markersRef.current.provider) {
        markersRef.current.provider.setLatLng([providerCoords.lat, providerCoords.lng])
      } else {
        markersRef.current.provider = L.marker([providerCoords.lat, providerCoords.lng], { icon: provIcon })
          .bindTooltip(providerName, { permanent: false, direction: 'top' })
          .addTo(map)
      }
    }

    // Customer marker
    if (customerCoords) {
      const custIcon = L.divIcon({
        html: `<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 2px 12px rgba(37,99,235,0.6)">🏠</div>`,
        className: '',
        iconSize:   [40, 40],
        iconAnchor: [20, 20],
      })
      if (markersRef.current.customer) {
        markersRef.current.customer.setLatLng([customerCoords.lat, customerCoords.lng])
      } else {
        markersRef.current.customer = L.marker([customerCoords.lat, customerCoords.lng], { icon: custIcon })
          .bindTooltip(customerName, { permanent: false, direction: 'top' })
          .addTo(map)
      }
    }

    // Draw a road route between the two locations. A direct-line fallback keeps
    // the map useful when the public routing service is temporarily unavailable.
    const requestId = ++routeRequestRef.current
    if (markersRef.current.route) {
      map.removeLayer(markersRef.current.route)
      markersRef.current.route = null
    }
    if (providerCoords && customerCoords) {
      const bounds = L.latLngBounds(
        [providerCoords.lat, providerCoords.lng],
        [customerCoords.lat, customerCoords.lng]
      )
      map.fitBounds(bounds, { padding: [40, 40] })
      fetch(`https://router.project-osrm.org/route/v1/driving/${providerCoords.lng},${providerCoords.lat};${customerCoords.lng},${customerCoords.lat}?overview=full&geometries=geojson`)
        .then(response => response.json())
        .then(payload => {
          if (requestId !== routeRequestRef.current || !leafletRef.current) return
          const geometry = payload?.routes?.[0]?.geometry
          markersRef.current.route = geometry
            ? L.geoJSON(geometry, { style: { color:'#2563eb', weight:5, opacity:0.9 } }).addTo(map)
            : L.polyline([[providerCoords.lat, providerCoords.lng], [customerCoords.lat, customerCoords.lng]], { color:'#2563eb', weight:4, dashArray:'10,8', opacity:0.85 }).addTo(map)
        })
        .catch(() => {
          if (requestId !== routeRequestRef.current || !leafletRef.current) return
          markersRef.current.route = L.polyline([[providerCoords.lat, providerCoords.lng], [customerCoords.lat, customerCoords.lng]], { color:'#2563eb', weight:4, dashArray:'10,8', opacity:0.85 }).addTo(map)
        })
    } else if (providerCoords) {
      map.setView([providerCoords.lat, providerCoords.lng], 15)
    } else if (customerCoords) {
      map.setView([customerCoords.lat, customerCoords.lng], 15)
    }
  }, [providerCoords, customerCoords, providerName, customerName])

  return (
    <div className="live-map-shell" style={{ position:'relative', zIndex:0, isolation:'isolate', width:'100%', maxWidth:'100%', height, overflow:'hidden', borderRadius:14 }}>
      <div ref={mapRef} className="live-map-canvas" style={{ width:'100%', maxWidth:'100%', height:'100%' }} />

      {/* Overlay — searching state */}
      {status === 'pending' && (
        <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.85)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:'#fff',           zIndex:20 }}>
          <div style={{ position:'relative', width:90, height:90, marginBottom:14 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ position:'absolute', inset:0, border:`2px solid rgba(249,115,22,${0.6-i*0.15})`, borderRadius:'50%', animation:`ripple ${1.5+i*0.5}s ease-out infinite`, animationDelay:`${i*0.5}s` }}/>
            ))}
            <div style={{ position:'absolute', inset:'20%', background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 0 20px rgba(249,115,22,0.6)' }}>📍</div>
          </div>
          <p style={{ fontWeight:700, fontSize:15 }}>Finding provider...</p>
          <p style={{ fontSize:12, opacity:0.6, marginTop:4 }}>Usually 2–3 minutes</p>
        </div>
      )}

      {/* Live badge */}
      <div style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.94)', border:'1px solid rgba(22,163,74,0.25)', borderRadius:20, padding:'5px 12px', display:'flex', alignItems:'center', gap:6, color:'#166534', fontSize:12, fontWeight:700, zIndex:20, boxShadow:'0 2px 8px rgba(15,23,42,0.12)' }}>
        <div className="live-dot" style={{ width:6, height:6 }} /> LIVE
      </div>

      <style>{`\n        .live-map-canvas .leaflet-container{width:100%;max-width:100%;height:100%;z-index:0}\n        .live-map-canvas .leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,0.78)}\n        @keyframes ripple{0%{transform:scale(0.5);opacity:1}100%{transform:scale(2.8);opacity:0}}\n      `}</style>
    </div>
  )
}
