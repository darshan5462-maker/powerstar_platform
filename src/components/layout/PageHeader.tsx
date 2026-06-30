interface PageHeaderProps { title:string; subtitle?:string; action?: React.ReactNode }
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{
      padding: '18px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      <div>
        <h1 style={{ fontSize:19, fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif', lineHeight:1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
  )
}
