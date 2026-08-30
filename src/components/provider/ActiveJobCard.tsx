// Active Job Card with live customer location map
// Drop this into ProviderHome.tsx replacing the existing activeJob block

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface Coords { lat: number; lng: number }

interface ActiveJobCardProps {
  job: any
  myCoords: Coords | null
  onStartJob:    (id: string) => void
  onCompleteJob: (id: string) => void
  onRefresh:     () => void
}

function calcDist(a: Coords, b: Coords) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

export default function ActiveJobCard({ job, myCoords, onStartJob, onCompleteJob, onRefresh }: ActiveJobCardProps) {
  const mapRef          = useRef<HTMLDivElement>(null)
  const leafletRef      = useRef<any>(null)
  const markersRef      = useRef<any>({})
  const [custCoords,    setCustCoords]    = useState<Coords|null>(null)
  const [distKm,        setDistKm]        = useState<number|null>(null)
  const [eta,           setEta]           = useState<number|null>(null)
  const [mapLoaded,     setMapLoaded]     = useState(false)
  const [showMap,       setShowMap]       = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const routeRef        = useRef<any>(null)

  // Fetch customer location from DB
  useEffect(() => {
    if (!job?.id) return

    // Initial fetch
    supabase.from('customer_locations')
      .select('latitude, longitude')
      .eq('booking_id', job.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLocationError('Customer GPS is not available yet.')
          return
        }
        if (data && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
          setCustCoords({ lat: data.latitude, lng: data.longitude })
          setLocationError(null)
        } else {
          setLocationError('Customer has not shared a live GPS location yet. You can still navigate to the saved address.')
        }
      })

    // Realtime subscription
    const ch = supabase.channel(`custloc-${job.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'customer_locations',
        filter: `booking_id=eq.${job.id}`
      }, (payload: any) => {
        const { latitude: lat, longitude: lng } = payload.new ?? {}
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setCustCoords({ lat, lng })
          setLocationError(null)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [job?.id])

  // Calculate distance when either coord changes
  useEffect(() => {
    if (!myCoords || !custCoords) return
    const d = calcDist(myCoords, custCoords)
    setDistKm(d)
    setEta(Math.max(1, Math.round(d * 3))) // ~20 km/h city speed
  }, [myCoords, custCoords])

  // Load Leaflet map
  useEffect(() => {
    if (!mapRef.current || !showMap) return
    const load = async () => {
      if (!document.getElementById('leaflet-css')) {
        const l = document.createElement('link')
        l.id = 'leaflet-css'; l.rel = 'stylesheet'
        l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(l)
      }
      if (!(window as any).L) {
        await new Promise<void>(res => {
          const s = document.createElement('script')
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          s.onload = () => res()
          document.head.appendChild(s)
        })
      }
      const L = (window as any).L
      if (!leafletRef.current && mapRef.current) {
        const center = myCoords ?? custCoords ?? { lat: 15.3173, lng: 75.7139 }
        const map = L.map(mapRef.current, {
          center: [center.lat, center.lng], zoom: 14,
          zoomControl: false, attributionControl: true,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map)
        L.control.zoom({ position: 'bottomright' }).addTo(map)
        leafletRef.current = map
        setMapLoaded(true)
        window.setTimeout(() => map.invalidateSize(), 0)
      }
    }
    load()
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
        markersRef.current = {}
        setMapLoaded(false)
      }
    }
  }, [showMap]) // eslint-disable-line

  // Update map markers
  useEffect(() => {
    const L = (window as any).L
    const map = leafletRef.current
    if (!L || !map) return

    // My marker (provider = scooter)
    if (myCoords) {
      const icon = L.divIcon({
        html: `<div style="background:linear-gradient(135deg,#16a34a,#15803d);width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 2px 12px rgba(22,163,74,0.7)">🛵</div>`,
        className: '', iconSize: [42,42], iconAnchor: [21,21]
      })
      if (markersRef.current.me) markersRef.current.me.setLatLng([myCoords.lat, myCoords.lng])
      else markersRef.current.me = L.marker([myCoords.lat, myCoords.lng], { icon })
        .bindTooltip('You', { permanent: true, direction: 'top', className: 'map-tooltip' })
        .addTo(map)
    }

    // Customer marker (home pin)
    if (custCoords) {
      const icon = L.divIcon({
        html: `<div style="background:linear-gradient(135deg,#f97316,#ea580c);width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 2px 14px rgba(249,115,22,0.7)">🏠</div>`,
        className: '', iconSize: [42,42], iconAnchor: [21,42]
      })
      if (markersRef.current.cust) markersRef.current.cust.setLatLng([custCoords.lat, custCoords.lng])
      else markersRef.current.cust = L.marker([custCoords.lat, custCoords.lng], { icon })
        .bindTooltip(job?.customer?.full_name ?? 'Customer', { permanent: true, direction: 'top', className: 'map-tooltip' })
        .addTo(map)
    }

    // Route line
    let cancelled = false
    const drawRoute = async () => {
      if (routeRef.current) {
        map.removeLayer(routeRef.current)
        routeRef.current = null
      }
      if (!myCoords || !custCoords) {
        if (myCoords) map.setView([myCoords.lat, myCoords.lng], 15)
        return
      }

      map.fitBounds(
        L.latLngBounds([[myCoords.lat,myCoords.lng],[custCoords.lat,custCoords.lng]]),
        { padding: [50, 50] }
      )

      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${myCoords.lng},${myCoords.lat};${custCoords.lng},${custCoords.lat}?overview=full&geometries=geojson`)
        const payload = await response.json()
        const geometry = payload?.routes?.[0]?.geometry
        if (!cancelled && geometry) {
          routeRef.current = L.geoJSON(geometry, { style: { color:'#f97316', weight:5, opacity:0.85 } }).addTo(map)
          return
        }
      } catch {
        // Fall back to a direct line when routing service is unavailable.
      }

      if (!cancelled) {
        routeRef.current = L.polyline(
          [[myCoords.lat, myCoords.lng], [custCoords.lat, custCoords.lng]],
          { color:'#f97316', weight:4, dashArray:'10,8', opacity:0.85 }
        ).addTo(map)
      }
    }
    void drawRoute()
    return () => { cancelled = true }
  }, [myCoords, custCoords, mapLoaded]) // eslint-disable-line

  function openGoogleMaps() {
    const savedAddress = [job?.address, job?.city, job?.district].filter(Boolean).join(', ')
    if (!custCoords && !savedAddress) { toast.error('Customer location and address are not available yet'); return }
    const destination = custCoords ? `${custCoords.lat},${custCoords.lng}` : encodeURIComponent(savedAddress)
    const origin = myCoords ? `&origin=${myCoords.lat},${myCoords.lng}` : ''
    const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.06),rgba(234,88,12,0.03))', border:'2px solid rgba(249,115,22,0.25)', borderRadius:18, overflow:'hidden', marginBottom:22 }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(249,115,22,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="live-dot" style={{ width:9, height:9 }} />
            <span style={{ fontWeight:800, fontSize:16, color:'var(--brand)' }}>
              {job.status==='accepted' ? 'Job Accepted — Head to Customer' : 'Job In Progress'}
            </span>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <p style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Booking #{job.booking_ref}</p>
      </div>

      {/* MAP — full width */}
      {showMap && (
        <div className="active-job-map" style={{ position:'relative', width:'100%', maxWidth:'100%', overflow:'hidden', isolation:'isolate' }}>
          <div ref={mapRef} className="provider-job-map" style={{ height:220, width:'100%', maxWidth:'100%' }} />

          {/* ETA pill over map */}
          {distKm !== null && eta !== null && job.status === 'accepted' && (
            <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.8)', borderRadius:20, padding:'7px 18px', color:'#fff', fontSize:13, fontWeight:700, zIndex:999, backdropFilter:'blur(8px)', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
              <span style={{ color:'#f97316' }}>🛵</span>
              {distKm.toFixed(1)} km · ~{eta} min to customer
            </div>
          )}

          {/* No customer location yet */}
          {!custCoords && (
            <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', maxWidth:'calc(100% - 24px)', background:'rgba(255,255,255,0.96)', border:'1px solid rgba(217,119,6,0.35)', boxShadow:'0 2px 10px rgba(15,23,42,0.15)', borderRadius:12, padding:'7px 14px', color:'#92400e', fontSize:11, fontWeight:700, zIndex:20, whiteSpace:'normal', textAlign:'center' }}>
              ⏳ {locationError ?? 'Waiting for customer to share location…'}
            </div>
          )}

          {/* Live badge */}
          <div style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.94)', border:'1px solid rgba(22,163,74,0.25)', borderRadius:20, padding:'5px 10px', display:'flex', alignItems:'center', gap:5, color:'#166534', fontSize:11, fontWeight:700, zIndex:20, boxShadow:'0 2px 8px rgba(15,23,42,0.12)' }}>
            <div className="live-dot" style={{ width:5, height:5 }} /> GPS Live
          </div>

          {/* Hide map toggle */}
          <button onClick={() => setShowMap(false)}
            style={{ position:'absolute', top:12, left:12, background:'rgba(255,255,255,0.94)', border:'1px solid var(--border)', borderRadius:8, padding:'5px 10px', color:'var(--text)', fontSize:11, cursor:'pointer', zIndex:20, boxShadow:'0 2px 8px rgba(15,23,42,0.12)' }}>
            Hide map
          </button>
        </div>
      )}

      {/* Show map toggle when hidden */}
      {!showMap && (
        <button onClick={() => setShowMap(true)}
          style={{ width:'100%', padding:'10px', background:'rgba(249,115,22,0.08)', border:'none', borderTop:'1px solid rgba(249,115,22,0.15)', borderBottom:'1px solid rgba(249,115,22,0.15)', color:'var(--brand)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
          🗺️ Show Navigation Map
        </button>
      )}

      {/* Job details grid */}
      <div style={{ padding:'16px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>

          {/* Customer */}
          <div style={{ background:'var(--bg2)', borderRadius:12, padding:'12px 14px' }}>
            <p style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.4px' }}>Customer</p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Avatar name={job.customer?.full_name ?? 'C'} size={30} />
              <div>
                <p style={{ fontSize:13, fontWeight:700 }}>{job.customer?.full_name ?? '—'}</p>
                <p style={{ fontSize:11, color:'var(--text2)' }}>{job.customer?.phone ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ background:'var(--bg2)', borderRadius:12, padding:'12px 14px' }}>
            <p style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.4px' }}>Destination</p>
            <p style={{ fontSize:13, fontWeight:600 }}>📍 {job.address}</p>
            <p style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{job.city}, {job.district}</p>
          </div>

          {/* Service & Earnings */}
          <div style={{ background:'var(--bg2)', borderRadius:12, padding:'12px 14px' }}>
            <p style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.4px' }}>Service</p>
            <p style={{ fontSize:13, fontWeight:700 }}>{job.category?.icon} {job.category?.name}</p>
            <p style={{ fontSize:14, fontWeight:800, color:'var(--brand)', marginTop:3 }}>
              ₹{Math.round((job.total_amount||0)*0.9).toLocaleString('en-IN')}
              <span style={{ fontSize:11, fontWeight:400, color:'var(--text3)', marginLeft:4 }}>your earning</span>
            </p>
          </div>

          {/* OTP */}
          <div style={{ background:'rgba(249,115,22,0.08)', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(249,115,22,0.2)' }}>
            <p style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.4px' }}>Start OTP</p>
            <p style={{ fontSize:30, fontWeight:900, letterSpacing:5, color:'var(--brand)', fontFamily:'monospace' }}>
              {job.start_otp ?? '----'}
            </p>
            <p style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>Ask customer on arrival</p>
          </div>
        </div>

        {/* Customer notes */}
        {job.customer_notes && (
          <div style={{ background:'var(--bg2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'var(--text2)', marginBottom:14 }}>
            💬 {job.customer_notes}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:'flex', gap:10 }}>
          <a href={`tel:${job.customer?.phone}`} className="btn btn-outline" style={{ flex:1, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            📞 Call Customer
          </a>

          <button className="btn btn-outline" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }} onClick={openGoogleMaps}>
            🗺️ Navigate
          </button>

          {job.status === 'accepted' && (
            <button className="btn btn-brand" style={{ flex:2, fontWeight:700 }} onClick={() => onStartJob(job.id)}>
              ▶ Start Job
            </button>
          )}
          {job.status === 'active' && (
            <button className="btn btn-success" style={{ flex:2, fontWeight:700 }} onClick={() => onCompleteJob(job.id)}>
              ✅ Mark Complete
            </button>
          )}
        </div>
      </div>

      <style>{`
        .provider-job-map .leaflet-container { width:100%; max-width:100%; z-index:0; }
        .provider-job-map .leaflet-control-attribution { font-size:9px; background:rgba(255,255,255,0.78); }
        .map-tooltip { background: rgba(255,255,255,0.96) !important; border: 1px solid rgba(15,23,42,0.12) !important; color: #0f172a !important; font-size: 11px !important; font-weight: 700 !important; padding: 3px 8px !important; border-radius: 6px !important; box-shadow: 0 2px 8px rgba(15,23,42,0.16) !important; }
        .map-tooltip::before { display: none !important; }
      `}</style>
    </div>
  )
}
