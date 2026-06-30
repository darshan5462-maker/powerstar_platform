import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function ViewAsBanner() {
  const { profile, viewAsRole, setViewAsRole } = useAuthStore()
  const navigate = useNavigate()

  // Only show when a real admin is currently previewing another role
  if (profile?.role !== 'admin' || !viewAsRole) return null

  function exitPreview() {
    setViewAsRole(null)
    navigate('/admin')
  }

  const labels: Record<string, string> = { customer: 'Customer', provider: 'Provider' }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
      color: '#fff', padding: '8px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      fontSize: 13, fontWeight: 600,
    }}>
      <span>👁️ Admin Preview Mode — viewing as <strong>{labels[viewAsRole]}</strong></span>
      <button
        onClick={exitPreview}
        style={{
          background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
          color: '#fff', padding: '4px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ← Exit Preview
      </button>
    </div>
  )
}
