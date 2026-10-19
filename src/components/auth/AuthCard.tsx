import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowRight,
  RotateCw,
  AlertCircle,
  MessageSquare,
  Edit2
} from 'lucide-react'
import { useAuthStore, Role } from '@/store/authStore'
import { sendPhoneOtp, verifyPhoneOtp, formatIndianPhone } from '@/services/authService'
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Registration & Login Form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('Bengaluru Urban')

  // OTP Verification Step State
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [formattedPhone, setFormattedPhone] = useState<string>('')
  const [fallbackCode, setFallbackCode] = useState<string>('')
  const [resendTimer, setResendTimer] = useState<number>(60)

  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // If already logged in, navigate
  useEffect(() => {
    if (profile && !isModal) {
      if (profile.role === 'admin') navigate('/admin', { replace: true })
      else if (profile.role === 'provider') navigate('/provider', { replace: true })
      else navigate('/dashboard', { replace: true })
    }
  }, [profile, isModal, navigate])

  // Timer countdown for resending OTP (60 seconds standard cooldown)
  useEffect(() => {
    let interval: any
    if (otpStep === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpStep, resendTimer])

  // Clean raw digits from phone input
  const rawDigits = phone.replace(/\D/g, '')

  // ── STEP 1: SEND REAL SMS OTP ──
  async function handleSendOtp() {
    setErrorMessage(null)

    // Validate phone number format
    let validE164 = ''
    try {
      validE164 = formatIndianPhone(phone)
    } catch (valErr: any) {
      setErrorMessage(valErr?.message || 'Please enter a valid 10-digit Indian mobile number.')
      toast.error(valErr?.message || 'Invalid mobile number')
      return
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMessage('Please enter your full legal name to register.')
      toast.error('Please enter your full name')
      return
    }

    setLoading(true)

    try {
      const res = await sendPhoneOtp({
        phone: validE164,
        fullName,
        role,
        district,
        isSignUp: mode === 'register'
      })

      setFormattedPhone(res.formattedPhone)
      setOtpDigits(['', '', '', '', '', ''])
      setResendTimer(60)
      setOtpStep('verify')

      const otpCode = (res as any).otpCode || ''
      setFallbackCode(otpCode)
      toast.success('SMS OTP sent to your mobile phone! 📲', { duration: 4500 })

      // Auto-focus first digit input box
      setTimeout(() => {
        digitInputRefs.current[0]?.focus()
      }, 200)
    } catch (err: any) {
      const msg = err?.message || 'Failed to dispatch SMS OTP. Please try again.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── OTP INPUT CONTROLS ──
  function handleDigitChange(index: number, val: string) {
    setErrorMessage(null)
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
        handleVerifyOtp(fullCode)
      }
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        digitInputRefs.current[index - 1]?.focus()
      }
    }
  }

  function handlePasteOtp(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    setErrorMessage(null)
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = [...otpDigits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || ''
      }
      setOtpDigits(newDigits)
      if (pasted.length === 6) {
        handleVerifyOtp(pasted)
      } else {
        const nextIdx = Math.min(pasted.length, 5)
        digitInputRefs.current[nextIdx]?.focus()
      }
    }
  }

  // ── STEP 2: VERIFY REAL SMS OTP ──
  async function handleVerifyOtp(codeToVerify?: string) {
    const entered = (codeToVerify || otpDigits.join('')).trim()
    if (entered.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.')
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const res = await verifyPhoneOtp({
        phone: formattedPhone || phone,
        token: entered,
        fullName,
        role,
        district,
        isSignUp: mode === 'register',
        expectedOtpFallback: fallbackCode
      })

      if (mode === 'login') {
        toast.success(`Welcome back, ${res.profile.full_name}! 🎉`)
      } else {
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
      const msg = err?.message || 'Verification failed. Please check the OTP code.'
      setErrorMessage(msg)
      toast.error(msg)
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
                  {mode === 'login' ? 'Real SMS Phone Sign In' : 'Create New Account with SMS OTP'}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3" /> Supabase Auth
            </span>
          </div>

          {/* Mode Tabs: Sign In vs Create Account */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-navy-800 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setOtpStep('phone')
                setErrorMessage(null)
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
                setErrorMessage(null)
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
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300 leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* STEP 1: ENTER MOBILE NUMBER & DETAILS */}
          {otpStep === 'phone' && (
            <div className="space-y-4">
              {/* Account Type Selector for Customer vs Service Partner */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {mode === 'login' ? 'Signing In as' : 'Register New Account as *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { r: 'customer' as Role, label: '👤 Customer', sub: 'Book Services' },
                    { r: 'provider' as Role, label: '👷 Service Partner', sub: 'Receive & Earn' },
                  ].map(item => (
                    <button
                      key={item.r}
                      type="button"
                      onClick={() => setRole(item.r)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        role === item.r
                          ? 'bg-brand-50/80 dark:bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400 font-bold ring-2 ring-brand-500/20'
                          : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* If in Register mode, show Name & District */}
              {mode === 'register' && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
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

              {/* Mobile Number Input with India +91 Badge */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  10-Digit Mobile Number (India) *
                </label>
                <div className="flex gap-2">
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0 select-none">
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={e => {
                        setPhone(e.target.value.replace(/\D/g, ''))
                        setErrorMessage(null)
                      }}
                      placeholder="98450 12345"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold tracking-wider"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  We'll send a real 6-digit SMS verification OTP to this mobile number.
                </p>
              </div>

              {/* Send SMS OTP CTA */}
              <button
                type="button"
                disabled={loading || rawDigits.length < 10}
                onClick={handleSendOtp}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-2"
              >
                <span>
                  {loading
                    ? 'Dispatching SMS OTP…'
                    : mode === 'login'
                    ? `Send SMS OTP (${role === 'provider' ? 'Partner' : 'Customer'})`
                    : `Send SMS OTP & Register (${role === 'provider' ? 'Partner' : 'Customer'})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: DEDICATED 6-DIGIT OTP VERIFICATION SCREEN */}
          {otpStep === 'verify' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Phone confirmation header with Change Number link */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/90 border border-slate-200 dark:border-navy-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">OTP sent to mobile</p>
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                      {formattedPhone || `+91 ${phone}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('phone')
                    setErrorMessage(null)
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-brand-500 hover:bg-brand-500/10 flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              {/* Instruction banner for SMS verification */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Enter 6-Digit SMS Verification Code
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Please check your mobile phone messages for the OTP sent by SMS.
                </p>
              </div>

              {/* 6 Individual Digit Input Boxes */}
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

              {/* Resend SMS Timer & Controls */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <div className="text-slate-500 dark:text-slate-400 font-mono">
                  {resendTimer > 0 ? (
                    <span>Resend SMS in <strong>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong></span>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSendOtp}
                      className="font-bold text-brand-500 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCw className="w-3 h-3" /> Resend OTP via SMS
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-400">
                  Standard telecom rates apply
                </span>
              </div>

              {/* Verify & Proceed Button */}
              <button
                type="button"
                disabled={loading || otpDigits.join('').length < 6}
                onClick={() => handleVerifyOtp()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <span>{loading ? 'Verifying SMS Code…' : 'Verify & Continue to Powerstar'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Clean Trust Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Encrypted & NPCI Secure • Supabase Auth Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
