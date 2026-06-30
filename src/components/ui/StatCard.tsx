interface StatCardProps {
  icon: string; iconBg: string; label: string; value: string|number
  change?: string; up?: boolean; onClick?: () => void
}
export default function StatCard({ icon, iconBg, label, value, change, up, onClick }: StatCardProps) {
  return (
    <div className="glass" style={{ padding:18, cursor:onClick?'pointer':'default', transition:'all 0.18s' }}
      onClick={onClick}
      onMouseEnter={e=>{ if(onClick)(e.currentTarget as HTMLElement).style.transform='translateY(-2px)' }}
      onMouseLeave={e=>{ if(onClick)(e.currentTarget as HTMLElement).style.transform='translateY(0)' }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:11, color:'var(--text2)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{label}</p>
          <p style={{ fontSize:24, fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{value}</p>
          {change && (
            <p style={{ fontSize:11, marginTop:5, color:up?'#16a34a':'#dc2626', fontWeight:600 }}>
              {up ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div style={{ width:40, height:40, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0 }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
