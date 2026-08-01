const STATUS: Record<string,{label:string;cls:string}> = {
  pending:{label:'Pending',cls:'badge badge-yellow'},
  accepted:{label:'Accepted',cls:'badge badge-blue'},
  active:{label:'Active',cls:'badge badge-orange'},
  completed:{label:'Completed',cls:'badge badge-green'},
  cancelled:{label:'Cancelled',cls:'badge badge-red'},
  verified:{label:'Verified',cls:'badge badge-green'},
  submitted:{label:'Submitted',cls:'badge badge-blue'},
  rejected:{label:'Rejected',cls:'badge badge-red'},
  online:{label:'Online',cls:'badge badge-green'},
  offline:{label:'Offline',cls:'badge badge-gray'},
  admin:{label:'Admin',cls:'badge badge-purple'},
  provider:{label:'Provider',cls:'badge badge-green'},
  customer:{label:'Customer',cls:'badge badge-orange'},
}
export function StatusBadge({status}:{status:string}){
  const s=STATUS[status]??{label:status,cls:'badge badge-gray'}
  return <span className={s.cls}>{s.label}</span>
}
export default function Badge({children,variant='gray'}:{children:React.ReactNode;variant?:string}){
  return <span className={`badge badge-${variant}`}>{children}</span>
}
