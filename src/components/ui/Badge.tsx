const STATUS: Record<string,{label:string;cls:string}> = {
  pending:   { label:'Pending',   cls:'badge badge-yellow' },
  pending_admin: { label:'Pending Admin', cls:'badge badge-yellow' },
  provider_assigned: { label:'Assigned', cls:'badge badge-blue' },
  payment_pending: { label:'Payment Pending', cls:'badge badge-orange' },
  payment_success: { label:'Paid', cls:'badge badge-green' },
  confirmed: { label:'Confirmed', cls:'badge badge-green' },
  in_progress: { label:'In Progress', cls:'badge badge-blue' },
  accepted:  { label:'Accepted',  cls:'badge badge-blue'   },
  active:    { label:'Active',    cls:'badge badge-orange' },
  completed: { label:'Completed', cls:'badge badge-green'  },
  cancelled: { label:'Cancelled', cls:'badge badge-red'    },
  verified:  { label:'Verified',  cls:'badge badge-green'  },
  submitted: { label:'Submitted', cls:'badge badge-blue'   },
  rejected:  { label:'Rejected',  cls:'badge badge-red'    },
  pending_kyc:{ label:'KYC Pending', cls:'badge badge-yellow'},
  online:    { label:'Online',    cls:'badge badge-green'  },
  offline:   { label:'Offline',   cls:'badge badge-gray'   },
  admin:     { label:'Admin',     cls:'badge badge-purple' },
  provider:  { label:'Provider',  cls:'badge badge-green'  },
  customer:  { label:'Customer',  cls:'badge badge-orange' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: 'badge badge-gray' }
  return <span className={s.cls}>{s.label}</span>
}

export default function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: string }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
