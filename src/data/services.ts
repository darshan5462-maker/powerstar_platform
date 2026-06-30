export interface Service {
  id:string; name:string; nameKn:string; icon:string; type:'manpower'|'vehicle'|'rto'|'financial'
  basePrice:number; unit:string; desc:string; available24h?:boolean; withWorker?:boolean; capacity?:string
}

export const MANPOWER: Service[] = [
  {id:'electrician',name:'Electrician',nameKn:'ವಿದ್ಯುತ್ ತಂತ್ರಜ್ಞ',icon:'⚡',type:'manpower',basePrice:280,unit:'/hr',desc:'Wiring, fans, switches, MCB, inverter installation',available24h:true},
  {id:'mason',name:'Mason / Gowndi',nameKn:'ಮೇಸ್ತ್ರಿ',icon:'🧱',type:'manpower',basePrice:350,unit:'/hr',desc:'Brick laying, plastering, concrete, RCC work'},
  {id:'plumber',name:'Plumber',nameKn:'ನಲ್ಲಿ ಕೆಲಸ',icon:'🔧',type:'manpower',basePrice:260,unit:'/hr',desc:'Pipe fitting, leakage, tank cleaning, bathroom fitting',available24h:true},
  {id:'centring',name:'Centring Worker',nameKn:'ಸೆಂಟ್ರಿಂಗ್',icon:'🏗️',type:'manpower',basePrice:300,unit:'/hr',desc:'Formwork, shuttering for RCC slabs and beams'},
  {id:'tile-worker',name:'Tile Worker',nameKn:'ಟೈಲ್ ಕೆಲಸ',icon:'🪣',type:'manpower',basePrice:290,unit:'/hr',desc:'Floor & wall tile fixing, marble, granite work'},
  {id:'construction',name:'Construction Worker',nameKn:'ಕಟ್ಟಡ ಕಾರ್ಮಿಕ',icon:'👷',type:'manpower',basePrice:250,unit:'/hr',desc:'Concrete mixing, material carrying, site support'},
  {id:'cleaning',name:'Home Cleaning',nameKn:'ಮನೆ ಸ್ವಚ್ಛತೆ',icon:'🧹',type:'manpower',basePrice:200,unit:'/hr',desc:'Deep cleaning, bathroom, kitchen, sofa cleaning'},
  {id:'shifting',name:'Home Shifting',nameKn:'ಮನೆ ಸ್ಥಳಾಂತರ',icon:'📦',type:'manpower',basePrice:1200,unit:'/job',desc:'Packing, loading, transport & unloading'},
  {id:'groundwork',name:'Ground Work Labor',nameKn:'ಮಣ್ಣಿನ ಕೆಲಸ',icon:'🌱',type:'manpower',basePrice:240,unit:'/hr',desc:'Digging, levelling, trench, foundation work'},
  {id:'driver',name:'Driver',nameKn:'ಚಾಲಕ',icon:'🚗',type:'manpower',basePrice:350,unit:'/hr',desc:'Licensed LMV/HMV driver for personal or commercial',available24h:true},
  {id:'helper',name:'Helper',nameKn:'ಸಹಾಯಕ',icon:'🤝',type:'manpower',basePrice:180,unit:'/hr',desc:'General helper for any work'},
  {id:'loading',name:'Loading / Unloading',nameKn:'ಲೋಡಿಂಗ್',icon:'💪',type:'manpower',basePrice:200,unit:'/hr',desc:'Loading goods from trucks, containers, warehouses',available24h:true},
  {id:'hospital',name:'Hospital Helper',nameKn:'ಆಸ್ಪತ್ರೆ ಸಹಾಯ',icon:'🏥',type:'manpower',basePrice:220,unit:'/hr',desc:'Patient attendant, ward boy, stretcher bearer',available24h:true},
  {id:'garment',name:'Garment Worker',nameKn:'ಉಡುಪು ಕೆಲಸ',icon:'🪡',type:'manpower',basePrice:190,unit:'/hr',desc:'Stitching, fabric cutting, tailoring'},
  {id:'hotel',name:'Hotel Staff',nameKn:'ಹೋಟೆಲ್ ಸಿಬ್ಬಂದಿ',icon:'🏨',type:'manpower',basePrice:200,unit:'/hr',desc:'Waiter, cook helper, housekeeping'},
  {id:'office',name:'Office Worker',nameKn:'ಕಚೇರಿ ಕೆಲಸ',icon:'🏢',type:'manpower',basePrice:220,unit:'/hr',desc:'Office boy, peon, data entry support'},
  {id:'financial-worker',name:'Financial Worker',nameKn:'ಹಣಕಾಸು',icon:'🏦',type:'manpower',basePrice:300,unit:'/hr',desc:'Loan recovery, field collection, banking support'},
  {id:'agriculture',name:'Agricultural Worker',nameKn:'ಕೃಷಿ ಕಾರ್ಮಿಕ',icon:'🌾',type:'manpower',basePrice:220,unit:'/hr',desc:'Harvesting, planting, irrigation, farm work'},
  {id:'delivery',name:'Delivery Worker',nameKn:'ಡೆಲಿವರಿ',icon:'📬',type:'manpower',basePrice:180,unit:'/hr',desc:'Local parcel, courier, document delivery',available24h:true},
  {id:'security',name:'Security Guard',nameKn:'ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ',icon:'🛡️',type:'manpower',basePrice:240,unit:'/hr',desc:'Site, building, event security',available24h:true},
]

export const VEHICLES: Service[] = [
  {id:'tata-ace',name:'Tata Ace',nameKn:'ಟಾಟಾ ಏಸ್',icon:'🚐',type:'vehicle',basePrice:899,unit:'/trip',desc:'Mini truck for light goods',capacity:'750 kg',withWorker:true},
  {id:'bolero',name:'Bolero Pickup',nameKn:'ಬೊಲೆರೊ',icon:'🛻',type:'vehicle',basePrice:1299,unit:'/trip',desc:'Medium pickup for construction material',capacity:'1.2 ton',withWorker:true},
  {id:'tata-intra',name:'Tata Intra',nameKn:'ಟಾಟಾ ಇಂಟ್ರಾ',icon:'🚐',type:'vehicle',basePrice:1099,unit:'/trip',desc:'City logistics and last-mile delivery',capacity:'1 ton',withWorker:true},
  {id:'truck-407',name:'407 Truck',nameKn:'407 ಟ್ರಕ್',icon:'🚛',type:'vehicle',basePrice:2199,unit:'/trip',desc:'Inter-city goods & furniture transport',capacity:'2.5 ton',withWorker:true},
  {id:'lorry',name:'Lorry',nameKn:'ಲಾರಿ',icon:'🚚',type:'vehicle',basePrice:3500,unit:'/trip',desc:'Heavy lorry for bulk goods & long distance',capacity:'5–9 ton',withWorker:true},
  {id:'tempo',name:'Tempo',nameKn:'ಟೆಂಪೋ',icon:'🚌',type:'vehicle',basePrice:1499,unit:'/trip',desc:'Medium goods van for city transport',capacity:'1.5 ton',withWorker:true},
  {id:'tractor',name:'Tractor',nameKn:'ಟ್ರ್ಯಾಕ್ಟರ್',icon:'🚜',type:'vehicle',basePrice:2800,unit:'/day',desc:'Farm tractor for agricultural & site work',capacity:'3–4 ton trailer'},
  {id:'jcb',name:'JCB Excavator',nameKn:'ಜೆಸಿಬಿ',icon:'🏗️',type:'vehicle',basePrice:4500,unit:'/day',desc:'Backhoe loader for digging & demolition',withWorker:true},
  {id:'hitachi',name:'Hitachi Excavator',nameKn:'ಹಿಟಾಚಿ',icon:'⛏️',type:'vehicle',basePrice:4800,unit:'/day',desc:'Heavy excavator for deep digging & mining',withWorker:true},
  {id:'crane',name:'Crane',nameKn:'ಕ್ರೇನ್',icon:'🏗️',type:'vehicle',basePrice:8000,unit:'/day',desc:'Mobile crane for heavy lifting',capacity:'10–50 ton',withWorker:true},
  {id:'tanker',name:'Water Tanker',nameKn:'ನೀರಿನ ಟ್ಯಾಂಕರ್',icon:'🚰',type:'vehicle',basePrice:1800,unit:'/trip',desc:'Water supply for sites & farms',capacity:'8,000 L',withWorker:true},
  {id:'auto',name:'Auto Riksha',nameKn:'ಆಟೋ',icon:'🛺',type:'vehicle',basePrice:349,unit:'/trip',desc:'Three-wheeler for small parcel delivery',capacity:'200 kg'},
  {id:'riksha',name:'3-Wheeler Riksha',nameKn:'ರಿಕ್ಷಾ',icon:'🛺',type:'vehicle',basePrice:299,unit:'/trip',desc:'Electric/petrol 3-wheeler hyper-local delivery',capacity:'300 kg'},
]

export const RTO: Service[] = [
  {id:'insurance',name:'Vehicle Insurance',nameKn:'ವಾಹನ ವಿಮೆ',icon:'🛡️',type:'rto',basePrice:500,unit:'/svc',desc:'New, renewal & comprehensive insurance'},
  {id:'puc',name:'PUC Certificate',nameKn:'ಪಿಯುಸಿ',icon:'📋',type:'rto',basePrice:200,unit:'/svc',desc:'Pollution Under Control certificate'},
  {id:'dl',name:'Driving License',nameKn:'ಚಾಲನಾ ಪರವಾನಗಿ',icon:'🪪',type:'rto',basePrice:800,unit:'/svc',desc:'New DL, renewal, duplicate, category addition'},
  {id:'passing',name:'Vehicle Passing',nameKn:'ವಾಹನ ಫಿಟ್ನೆಸ್',icon:'✅',type:'rto',basePrice:600,unit:'/svc',desc:'Fitness certificate & registration renewal'},
  {id:'gps',name:'GPS Installation',nameKn:'ಜಿಪಿಎಸ್',icon:'📍',type:'rto',basePrice:1200,unit:'/svc',desc:'AIS140 GPS for commercial vehicles'},
]

export const FINANCIAL: Service[] = [
  {id:'vehicle-loan',name:'Vehicle Loan',nameKn:'ವಾಹನ ಸಾಲ',icon:'🚗',type:'financial',basePrice:0,unit:'/svc',desc:'New & used vehicle financing'},
  {id:'insurance-loan',name:'Insurance Loan',nameKn:'ವಿಮಾ ಸಾಲ',icon:'📄',type:'financial',basePrice:0,unit:'/svc',desc:'Loan against LIC policy'},
  {id:'tyre-loan',name:'Tyre Loan',nameKn:'ಟೈರ್ ಸಾಲ',icon:'⭕',type:'financial',basePrice:0,unit:'/svc',desc:'Easy EMI tyre purchase for commercial vehicles'},
  {id:'personal-loan',name:'Personal Loan',nameKn:'ವೈಯಕ್ತಿಕ ಸಾಲ',icon:'💰',type:'financial',basePrice:0,unit:'/svc',desc:'Instant personal loans for all workers'},
]

export const ALL_SERVICES = [...MANPOWER,...VEHICLES,...RTO,...FINANCIAL]

export const PROVIDER_COUNTS: Record<string,number> = {
  electrician:320,mason:480,plumber:290,centring:160,
  'tile-worker':210,construction:540,cleaning:540,shifting:180,
  groundwork:200,driver:390,helper:280,loading:620,
  hospital:90,garment:75,hotel:140,office:110,
  'financial-worker':45,agriculture:200,delivery:430,security:180,
  'tata-ace':64,bolero:48,'tata-intra':32,'truck-407':56,
  lorry:72,tempo:40,tractor:85,jcb:18,hitachi:12,crane:8,tanker:24,auto:180,riksha:95,
}

export function calcPrice(basePrice:number, hours=1, surge=1) {
  const base = Math.round(basePrice * hours * surge)
  const fee  = Math.round(base * 0.05)
  const gst  = Math.round(fee * 0.18)
  return { base, fee, gst, total: base+fee+gst, payout: Math.round(base*0.9) }
}
