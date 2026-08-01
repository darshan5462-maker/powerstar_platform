const COLORS=['#f97316','#2563eb','#16a34a','#7c3aed','#d97706','#0891b2','#be185d','#059669']
function getColor(name?:string,override?:string){
  if(override)return override
  if(!name)return COLORS[0]
  return COLORS[name.charCodeAt(0)%COLORS.length]
}
function getInitials(name?:string){
  if(!name)return '?'
  const p=name.trim().split(' ').filter(Boolean)
  if(p.length>=2)return(p[0][0]+p[p.length-1][0]).toUpperCase()
  return p[0]?.[0]?.toUpperCase()??'?'
}
export default function Avatar({name,size=36,color,src}:{name?:string;size?:number;color?:string;src?:string}){
  return(
    <div style={{width:size,height:size,borderRadius:'50%',background:src?'transparent':getColor(name,color),display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:800,color:'#fff',flexShrink:0,overflow:'hidden',fontFamily:'Plus Jakarta Sans,sans-serif',boxShadow:'0 1px 4px rgba(0,0,0,0.12)',userSelect:'none'}}>
      {src?<img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:getInitials(name)}
    </div>
  )
}
