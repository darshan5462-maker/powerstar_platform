interface AvatarProps { name?: string; size?: number; color?: string; src?: string }
const COLORS = ['#f97316','#2563eb','#16a34a','#7c3aed','#db2777','#0891b2','#d97706']
export default function Avatar({ name='U', size=36, color, src }: AvatarProps) {
  const bg = color ?? COLORS[name.charCodeAt(0) % COLORS.length]
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  if (src) return <img src={src} alt={name} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover'}} />
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:Math.round(size*0.38),flexShrink:0,fontFamily:'Plus Jakarta Sans,sans-serif'}}>
      {initials}
    </div>
  )
}
