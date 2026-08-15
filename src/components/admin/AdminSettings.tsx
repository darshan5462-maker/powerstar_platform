import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [s, setS] = useState({
    platform_name:'POWERSTAR', support_phone:'+91 80 4567 8900',
    support_email:'support@powerstar.in', platform_fee:'5',
    gst_percent:'18', settlement_hours:'24',
    sms_provider:'MSG91', push_provider:'Firebase FCM',
    razorpay_key:'rzp_live_xxxxxxxxxx', min_booking:'100',
  })
  const set = (k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setS(v=>({...v,[k]:e.target.value}))

  return (
    <div>
      <PageHeader title="Platform Settings" subtitle="Global configuration for POWERSTAR" />
      <div className="page-content" style={{maxWidth:640}}>
        {[
          { title:'General', fields:[
            {k:'platform_name',label:'Platform Name',type:'text'},
            {k:'support_phone',label:'Support Phone',type:'text'},
            {k:'support_email',label:'Support Email',type:'email'},
          ]},
          { title:'Financial', fields:[
            {k:'platform_fee',label:'Platform Fee (%)',type:'number'},
            {k:'gst_percent', label:'GST (%)',          type:'number'},
            {k:'settlement_hours',label:'Settlement (hours)',type:'number'},
            {k:'min_booking', label:'Min Booking (₹)', type:'number'},
          ]},
          { title:'Integrations', fields:[
            {k:'razorpay_key',label:'Razorpay Key ID',type:'text'},
          ]},
        ].map(section=>(
          <div key={section.title} className="glass" style={{padding:24,marginBottom:16}}>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:18,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>{section.title}</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {section.fields.map(f=>(
                <div key={f.k}>
                  <label className="input-label">{f.label}</label>
                  <input className="input" type={f.type} value={(s as any)[f.k]} onChange={set(f.k)} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="glass" style={{padding:24,marginBottom:20}}>
          <h3 style={{fontWeight:700,fontSize:15,marginBottom:18,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>Notifications</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label className="input-label">SMS Provider</label>
              <select className="input" value={s.sms_provider} onChange={set('sms_provider')}>
                <option>MSG91</option><option>Twilio</option><option>Exotel</option>
              </select>
            </div>
            <div>
              <label className="input-label">Push Notifications</label>
              <select className="input" value={s.push_provider} onChange={set('push_provider')}>
                <option>Firebase FCM</option><option>OneSignal</option>
              </select>
            </div>
          </div>
        </div>

        <button className="btn btn-brand" style={{width:'100%'}} onClick={()=>toast.success('Settings saved successfully!')}>
          Save All Settings
        </button>
      </div>
    </div>
  )
}
