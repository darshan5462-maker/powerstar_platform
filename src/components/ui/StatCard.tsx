interface P{icon:string;iconBg:string;label:string;value:string|number;change?:string;up?:boolean;onClick?:()=>void}
export default function StatCard({icon,iconBg,label,value,change,up,onClick}:P){
  return(
    <div className="glass" style={{padding:18,cursor:onClick?'pointer':'default',transition:'all 0.18s'}}
      onClick={onClick}
      onMouseEnter={e=>{if(onClick){const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-2px)';el.style.boxShadow='var(--shadow-md)'}}}
      onMouseLeave={e=>{if(onClick){const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow=''}}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:11,color:'var(--text2)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.4px'}}>{label}</p>
          <p style={{fontSize:26,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif',lineHeight:1}}>{value}</p>
          {change&&<p style={{fontSize:11,marginTop:6,color:up?'#16a34a':'#dc2626',fontWeight:600}}>{up?'↑':'↓'} {change}</p>}
        </div>
        <div style={{width:42,height:42,borderRadius:12,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,marginLeft:8}}>{icon}</div>
      </div>
    </div>
  )
}
