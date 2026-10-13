import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Smartphone,
  RotateCw,
  Sparkles,
  Info,
  KeyRound,
  X,
  AlertCircle
} from 'lucide-react'
import { useAuthStore, Role } from '@/store/authStore'
import { signInWithOtp, signUpWithOtp, signIn } from '@/services/authService'
import { DISTRICTS } from '@/data/karnataka'
import toast from 'react-hot-toast'

interface AuthCardProps {
  initialMode?: 'login' | 'register'
  initialRole?: Role
  onSuccess?: () => void
  isModal?: boolean
}

export default function AuthCard({
  initialMode = 'login',
  initialRole = 'customer',
  onSuccess,
  isModal = false
}: AuthCardProps) {
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [role, setRole] = useState<Role>(initialRole)
  const [loading, setLoading] = useState(false)

  // Registration & Login Form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('Bengaluru Urban')

  // OTP Verification Step State
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [generatedOtp, setGeneratedOtp] = useState<string>('')
  const [resendTimer, setResendTimer] = useState<number>(30)

  // Hidden Admin Login Dialog
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('admin@powerstar.in')
  const [adminPassword, setAdminPassword] = useState('admin1234')

  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // If already logged in, navigate
  useEffect(() => {
    if (profile && !isModal) {
      if (profile.role === 'admin') navigate('/admin', { replace: true })
      else if (profile.role === 'provider') navigate('/provider', { replace: true })
      else navigate('/dashboard', { replace: true })
    }
  }, [profile, isModal, navigate])

  // Timer countdown for resending OTP
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpStep === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpStep, resendTimer])

  // Clean phone string (e.g. "98450 12345" -> "9845012345")
  const getCleanPhone = () => phone.replace(/\D/g, '').slice(-10)

  // Generate and display verification code
  function handleSendOtp() {
    const cleanNumber = getCleanPhone()
    if (!cleanNumber || cleanNumber.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    if (mode === 'register' && !fullName.trim()) {
      toast.error('Please enter your full name to create an account')
      return
    }

    setLoading(true)

    setTimeout(() => {
      // Generate a clean 6-digit random code
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(randomCode)
      setOtpDigits(['', '', '', '', '', ''])
      setResendTimer(30)
      setOtpStep('verify')
      setLoading(false)

      toast.success(`Verification code generated: ${randomCode}`, { icon: '📲', duration: 4500 })

      // Auto-focus first digit after transition
      setTimeout(() => {
        digitInputRefs.current[0]?.focus()
      }, 150)
    }, 450)
  }

  // Handle single digit input
  function handleDigitChange(index: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)

    // Auto-focus next box
    if (digit && index < 5) {
      digitInputRefs.current[index + 1]?.focus()
    }

    // Auto verify if all 6 filled
    if (digit && index === 5) {
      const fullCode = newDigits.join('')
      if (fullCode.length === 6) {
        verifyOtp(fullCode)
      }
    }
  }

  // Handle backspace in OTP boxes
  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        digitInputRefs.current[index - 1]?.focus()
      }
    }
  }

  // Handle pasting full 6-digit OTP
  function handlePasteOtp(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = [...otpDigits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || ''
      }
      setOtpDigits(newDigits)
      if (pasted.length === 6) {
        verifyOtp(pasted)
      } else {
        const nextIdx = Math.min(pasted.length, 5)
        digitInputRefs.current[nextIdx]?.focus()
      }
    }
  }

  // Auto-fill OTP button
  function handleAutoFill() {
    const code = generatedOtp || '123456'
    setOtpDigits(code.split(''))
    toast.success('Auto-filled verification code!', { icon: '⚡' })
    verifyOtp(code)
  }

  // Verify entered OTP
  async function verifyOtp(codeToVerify?: string) {
    const entered = (codeToVerify || otpDigits.join('')).trim()
    if (entered.length < 6) {
      toast.error('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await signInWithOtp(phone, entered, generatedOtp, role)
        toast.success(`Welcome back, ${res.profile.full_name}! 🎉`)
      } else {
        const res = await signUpWithOtp({
          full_name: fullName,
          phone,
          role,
          district,
          enteredOtp: entered,
          expectedOtp: generatedOtp
        })
        toast.success(`Welcome to POWERSTAR, ${res.profile.full_name}! Account created 🎉`)
      }

      onSuccess?.()

      const curProfile = useAuthStore.getState().profile
      if (curProfile) {
        if (curProfile.role === 'admin') navigate('/admin')
        else if (curProfile.role === 'provider') navigate('/provider')
        else navigate('/dashboard')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Hidden Admin Login Handler
  async function handleAdminSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(adminEmail, adminPassword)
      toast.success('Admin Master Authenticated! ⚡')
      setShowAdminLogin(false)
      onSuccess?.()
      navigate('/admin')
    } catch (err: any) {
      toast.error(err?.message || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-card border border-slate-200/80 dark:border-navy-800 overflow-hidden">
        {/* Card Header & Mode Switcher */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-navy-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-brand">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white font-display tracking-tight">
                  POWER<span className="text-brand-500">STAR</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {mode === 'login' ? 'Mobile Number Sign In' : 'Create New Account'}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3" /> OTP Verified
            </span>
          </div>

          {/* Mode Tabs: Sign In vs Create Account */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-navy-800 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setOtpStep('phone')
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setOtpStep('phone')
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Auth Body */}
        <div className="p-6 space-y-5">
          {/* STEP 1: ENTER MOBILE NUMBER & DETAILS */}
          {otpStep === 'phone' && (
            <div className="space-y-4">
              {/* If in Register mode, show Name & Role & District */}
              {mode === 'register' && (
                <>
                  {/* Account Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      I want to register as *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { r: 'customer' as Role, label: '👤 Customer', sub: 'Book Services' },
                        { r: 'provider' as Role, label: '👷 Service Partner', sub: 'Receive Jobs' },
                      ].map(item => (
                        <button
                          key={item.r}
                          type="button"
                          onClick={() => setRole(item.r)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            role === item.r
                              ? 'bg-brand-50/80 dark:bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400 font-bold ring-2 ring-brand-500/20'
                              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <p className="text-xs font-bold">{item.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {/* District Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Karnataka District
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <select
                        value={district}
                        onChange={e => setDistrict(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {DISTRICTS.map(d => (
                          <option key={d.id} value={d.name}>
                            {d.name} {d.nameKn ? `(${d.nameKn})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Mobile Number Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <div className="flex gap-2">
                  <div className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98450 12345"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold tracking-wider"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  We'll verify your number instantly with a 6-digit security code.
                </p>
              </div>

              {/* Quick Test Demo Chips (Only Customer & Provider, Admin is removed) */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Quick demo fill:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhone('9845011111')
                      setRole('customer')
                      toast.success('Filled Customer demo number')
                    }}
                    className="text-brand-500 font-bold hover:underline"
                  >
                    Customer Demo
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhone('9845022222')
                      setRole('provider')
                      toast.success('Filled Provider demo number')
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Provider Demo
                  </button>
                </div>
              </div>

              {/* Send OTP CTA */}
              <button
                type="button"
                disabled={loading || getCleanPhone().length < 10}
                onClick={handleSendOtp}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-1"
              >
                <span>
                  {loading
                    ? 'Generating Code…'
                    : mode === 'login'
                    ? 'Get 6-Digit OTP to Sign In'
                    : 'Get Verification Code & Register'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: 6-DIGIT OTP VERIFICATION BOXES */}
          {otpStep === 'verify' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Direct In-Card OTP Display Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-50 to-orange-50 dark:from-navy-800 dark:to-navy-800/90 border border-brand-200 dark:border-navy-700 text-center space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                    Instant Verification Code
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpStep('phone')}
                    className="text-[10px] font-bold text-slate-500 hover:text-brand-500 underline"
                  >
                    Change Number
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-widest bg-white dark:bg-navy-900 px-4 py-1.5 rounded-xl border border-brand-300 dark:border-navy-600 shadow-xs">
                    {generatedOtp || '123456'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Fill</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Verification code for <strong className="text-slate-800 dark:text-slate-200 font-mono">+91 {getCleanPhone()}</strong>. Tap Auto-Fill or enter the 6 digits below.
                </p>
              </div>

              {/* 6 Individual Digit Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 pt-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (digitInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(idx, e)}
                    onPaste={handlePasteOtp}
                    className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl border text-center font-mono text-xl sm:text-2xl font-black transition-all ${
                      digit
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-500/10 text-brand-600 dark:text-white ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                ))}
              </div>

              {/* Resend Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="text-slate-500 dark:text-slate-400 font-mono">
                  {resendTimer > 0 ? (
                    <span>New code in <strong>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="font-bold text-brand-500 hover:underline flex items-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" /> Generate New Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const fallback = generatedOtp || '123456'
                    setOtpDigits(fallback.split(''))
                    verifyOtp(fallback)
                  }}
                  className="text-[11px] text-brand-500 font-bold hover:underline"
                >
                  Quick Sign In →
                </button>
              </div>

              {/* Verify CTA */}
              <button
                type="button"
                disabled={loading || otpDigits.join('').length < 6}
                onClick={() => verifyOtp()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <span>{loading ? 'Verifying Code…' : 'Verify & Continue to Powerstar'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer & Hidden Staff Portal Link */}
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>RBI & NPCI Secure</span>
            </span>

            {/* Hidden discrete Admin Access link (Not an open chip) */}
            <button
              type="button"
              onClick={() => setShowAdminLogin(true)}
              className="hover:text-slate-600 dark:hover:text-slate-300 underline transition-colors"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </div>

      {/* ── HIDDEN ADMIN / STAFF LOGIN MODAL ── */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-navy-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-navy-700 space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Lock className="w-5 h-5 text-brand-500" />
                <h4 className="font-bold text-sm">Powerstar Staff Portal</h4>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Restricted access for internal dispatch managers and system administrators.
              </p>

              <form onSubmit={handleAdminSignIn} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Staff Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Master Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{loading ? 'Authenticating…' : 'Authenticate Staff'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
