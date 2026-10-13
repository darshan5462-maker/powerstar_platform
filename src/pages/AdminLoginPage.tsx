import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Zap, ArrowRight, ShieldCheck } from 'lucide-react'
import { signIn } from '@/services/authService'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@powerstar.in')
  const [password, setPassword] = useState('admin1234')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Admin Master Authenticated! ⚡')
      navigate('/admin', { replace: true })
    } catch (err: any) {
      toast.error(err?.message || 'Invalid administrator credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-brand">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-wider font-display">
              POWER<span className="text-brand-500">STAR</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-brand-500" />
            <span>Confidential Admin Portal</span>
          </h2>
          <p className="text-xs text-slate-400">
            Internal dispatch control, booking management & platform settings
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@powerstar.in"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-2"
            >
              <span>{loading ? 'Authenticating Admin…' : 'Enter Admin Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted Master Session</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hover:text-white underline transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
