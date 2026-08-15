const COLORS = ['#f97316','#2563eb','#16a34a','#7c3aed','#d97706','#0891b2','#be185d','#059669']

function getColor(name?: string, override?: string) {
  if (override) return override
  if (!name) return COLORS[0]
  const i = name.charCodeAt(0) % COLORS.length
  return COLORS[i]
}

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() ?? '?'
}

interface AvatarProps {
  name?: string; size?: number; color?: string; src?: string
}

export default function Avatar({ name, size = 36, color, src }: AvatarProps) {
  const bg      = getColor(name, color)
  const initials = getInitials(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: src ? 'transparent' : bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: '#fff',
      flexShrink: 0, overflow: 'hidden', fontFamily: 'Plus Jakarta Sans, sans-serif',
      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      userSelect: 'none',
    }}>
      {src ? <img src={src} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials}
    </div>
  )
}
