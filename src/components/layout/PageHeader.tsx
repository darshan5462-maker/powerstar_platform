interface P{title:string;subtitle?:string;action?:React.ReactNode;back?:()=>void}
export default function PageHeader({title,subtitle,action,back}:P){
  return(
    <div className="page-header-shell" style={{padding:'0 24px',minHeight:64,height:'auto',borderBottom:'1px solid var(--border)',background:'var(--card)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:20,flexShrink:0,gap:12}}>
      <div className="page-header-main" style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
        {back&&(
          <button onClick={back} style={{width:32,height:32,borderRadius:8,border:'1.5px solid var(--border)',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:14,color:'var(--text2)',flexShrink:0,transition:'all 0.15s'}}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--brand)';el.style.color='var(--brand)'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--border)';el.style.color='var(--text2)'}}>←</button>
        )}
        <div style={{minWidth:0}}>
          <h1 className="page-header-title" style={{fontSize:18,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{title}</h1>
          {subtitle&&<p className="page-header-subtitle" style={{fontSize:12,color:'var(--text2)',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{subtitle}</p>}
        </div>
      </div>
      {action&&<div className="page-header-action" style={{flexShrink:0,marginLeft:16}}>{action}</div>}
    </div>
  )
}
