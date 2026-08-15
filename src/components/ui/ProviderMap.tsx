// Provider's view — shows their own location + customer location
import { useEffect, useRef } from 'react'

interface Coords { lat: number; lng: number }
interface ProviderMapProps {
  myCoords?:       Coords | null
  customerCoords?: Coords | null
  customerName?:   string
  height?:         number
}

export default function ProviderMap({ myCoords, customerCoords, customerName='Customer', height=220 }: ProviderMapProps) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const markersRef = useRef<{me?:any; customer?:any; route?:any}>({})

  useEffect(() => {
    if (!mapRef.current) return
    const load = async () => {
      if (!document.getElementById('leaflet-css')) {
        const l = document.createElement('link'); l.id='leaflet-css'; l.rel='stylesheet'
        l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l)
      }
      if (!(window as any).L) {
        await new Promise<void>(res => {
          const s = document.createElement('script')
          s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          s.onload=()=>res(); document.head.appendChild(s)
        })
      }
      const L = (window as any).L
      if (!leafletRef.current && mapRef.current) {
        const center = myCoords ?? customerCoords ?? {lat:15.3173, lng:75.7139}
        const map = L.map(mapRef.current, {center:[center.lat,center.lng], zoom:15, zoomControl:false, attributionControl:false})
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {maxZoom:19}).addTo(map)
        L.control.zoom({position:'bottomright'}).addTo(map)
        leafletRef.current = map
      }
    }
    load()
    return () => { if(leafletRef.current){leafletRef.current.remove();leafletRef.current=null;markersRef.current={}} }
  }, []) // eslint-disable-line

  useEffect(() => {
    const L = (window as any).L; const map = leafletRef.current
    if (!L || !map) return

    if (myCoords) {
      const icon = L.divIcon({html:`<div style="background:linear-gradient(135deg,#16a34a,#15803d);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 2px 12px rgba(22,163,74,0.6)">🛵</div>`,className:'',iconSize:[40,40],iconAnchor:[20,20]})
      if (markersRef.current.me) markersRef.current.me.setLatLng([myCoords.lat,myCoords.lng])
      else markersRef.current.me = L.marker([myCoords.lat,myCoords.lng],{icon}).bindTooltip('You',{permanent:false,direction:'top'}).addTo(map)
    }

    if (customerCoords) {
      const icon = L.divIcon({html:`<div style="background:linear-gradient(135deg,#f97316,#ea580c);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 2px 12px rgba(249,115,22,0.6)">🏠</div>`,className:'',iconSize:[40,40],iconAnchor:[20,20]})
      if (markersRef.current.customer) markersRef.current.customer.setLatLng([customerCoords.lat,customerCoords.lng])
      else markersRef.current.customer = L.marker([customerCoords.lat,customerCoords.lng],{icon}).bindTooltip(customerName,{permanent:false,direction:'top'}).addTo(map)
    }

    if (myCoords && customerCoords) {
      if (markersRef.current.route) map.removeLayer(markersRef.current.route)
      markersRef.current.route = L.polyline([[myCoords.lat,myCoords.lng],[customerCoords.lat,customerCoords.lng]],{color:'#f97316',weight:3,dashArray:'10,8',opacity:0.8}).addTo(map)
      map.fitBounds(L.latLngBounds([[myCoords.lat,myCoords.lng],[customerCoords.lat,customerCoords.lng]]),{padding:[40,40]})
    } else if (myCoords) {
      map.setView([myCoords.lat,myCoords.lng],15)
    }
  }, [myCoords, customerCoords, customerName])

  return (
    <div style={{position:'relative',height,borderRadius:14,overflow:'hidden',border:'1px solid var(--border)'}}>
      <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
      <div style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,0.7)',borderRadius:20,padding:'4px 12px',display:'flex',alignItems:'center',gap:6,color:'#fff',fontSize:11,fontWeight:700,zIndex:999,backdropFilter:'blur(6px)'}}>
        <div className="live-dot" style={{width:6,height:6}}/> GPS Live
      </div>
    </div>
  )
}
