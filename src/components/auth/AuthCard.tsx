import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Smartphone,
  RotateCw,
  Sparkles,
  Info,
  Check,
  KeyRound,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import { useAuthStore, Role } from '@/store/authStore'
import { signIn, signUp, signInWithOtp, signUpWithOtp } from '@/services/authService'
import { DISTRICTS } from '@/data/karnataka'
import toast from 'react-hot-toast'

interface AuthCardProps {
  initialMode?: 'login' | 'register'
  initialRole?: Role
  onSuccess?: () => void
  isModal?: boolean
}

const DEMO_CHIPS = [
  { role: 'customer' as Role, phone: '9845011111', email: 'customer@demo.com', pwd: 'demo1234', label: 'Customer Demo', icon: '👤', sub: 'Book Services' },
  { role: 'provider' as Role, phone: '9845022222', email: 'provider@demo.com', pwd: 'demo1234', label: 'Provider Demo', icon: '👷', sub: 'Receive Jobs' },
  { role: 'admin' as Role, phone: '9845099999', email: 'admin@powerstar.in', pwd: 'admin1234', label: 'Admin Master', icon: '⚡', sub: 'Dispatch Center' },
]

export default function AuthCard({ initialMode = 'login', initialRole = 'customer', onSuccess, isModal = false }: AuthCardProps) {
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp')
  const [role, setRole] = useState<Role>(initialRole)
  const [loading, setLoading] = useState(false)

  // Registration & Login Form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('Bengaluru Urban')
  const [email, setEmail] = useState('customer@demo.com')
  const [password, setPassword] = useState('demo1234')

  // OTP Verification Step State
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [generatedOtp, setGeneratedOtp] = useState<string>('')
  const [resendTimer, setResendTimer] = useState<number>(30)
  const [smsBanner, setSmsBanner] = useState<{ show: boolean; otp: string; channel: 'SMS' | 'WhatsApp' }>({ show: false, otp: '', channel: 'SMS' })

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

  // 1-Click Demo Fill
  function handleFillDemo(chip: typeof DEMO_CHIPS[0]) {
    setRole(chip.role)
    setPhone(chip.phone)
    setEmail(chip.email)
    setPassword(chip.pwd)
    if (authMethod === 'password') {
      toast.success(`Loaded credentials for ${chip.label}`)
    } else {
      toast.success(`Selected ${chip.label} (+91 ${chip.phone})`)
    }
  }

  // Generate and send a realistic 6-digit OTP
  function handleSendOtp(channel: 'SMS' | 'WhatsApp' = 'SMS') {
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
      // Generate a realistic 6-digit random code
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(randomCode)
      setOtpDigits(['', '', '', '', '', ''])
      setResendTimer(30)
      setOtpStep('verify')
      setLoading(false)

      // Show realistic SMS Dispatch banner
      setSmsBanner({ show: true, otp: randomCode, channel })

      // Audio/vibrate simulation if available
      try {
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
      } catch (e) {
        // ignore
      }

      toast.success(
        channel === 'SMS'
          ? `6-digit security OTP sent to +91 ${cleanNumber}`
          : `WhatsApp security verification code sent!`,
        { icon: '📲', duration: 4000 }
      )

      // Auto-focus first digit after animation
      setTimeout(() => {
        digitInputRefs.current[0]?.focus()
      }, 150)
    }, 700)
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

  // Auto-fill OTP button in realistic SMS banner
  function handleAutoFillSms() {
    if (!generatedOtp) return
    const arr = generatedOtp.split('')
    setOtpDigits(arr)
    toast.success('Auto-filled verification code from SMS!', { icon: '⚡' })
    verifyOtp(generatedOtp)
  }

  // Verify entered OTP
  async function verifyOtp(codeToVerify?: string) {
    const entered = codeToVerify || otpDigits.join('')
    if (entered.length < 6) {
      toast.error('Please enter all 6 digits of your verification code')
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
        toast.success(`Welcome to POWERSTAR, ${res.profile.full_name}! Account verified 🎉`)
      }

      onSuccess?.()

      // Redirect if not modal
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

  // Password-based submit fallback
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Signed in successfully!')
      } else {
        if (!fullName.trim() || !phone.trim()) {
          toast.error('Please enter your full name and mobile number')
          return
        }
        await signUp({
          email,
          password,
          full_name: fullName,
          phone,
          role,
          district
        })
        toast.success('Account created successfully!')
      }

      onSuccess?.()
      const curProfile = useAuthStore.getState().profile
      if (curProfile) {
        if (curProfile.role === 'admin') navigate('/admin')
        else if (curProfile.role === 'provider') navigate('/provider')
        else navigate('/dashboard')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* ── REALISTIC SMS NOTIFICATION BANNER (SLIDE-DOWN) ── */}
      <AnimatePresence>
        {smsBanner.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl border border-emerald-400/40 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                      {smsBanner.channel === 'SMS' ? 'TRAI DLT SMS' : 'WhatsApp Security'}
                    </span>
                    <span className="text-[10px] text-emerald-100 font-mono">Just Now</span>
                  </div>
                  <p className="text-xs font-bold text-white mt-1">
                    Your POWERSTAR OTP is <span className="font-mono text-sm underline decoration-wavy tracking-wider">{smsBanner.otp}</span>
                  </p>
                  <p className="text-[10px] text-emerald-100 mt-0.5">
                    Valid for 10 minutes. Do not share with anyone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoFillSms}
                className="px-2.5 py-1.5 rounded-xl bg-white text-emerald-800 text-[11px] font-black hover:bg-emerald-50 transition-all flex items-center gap-1 shadow-sm active:scale-95 flex-shrink-0"
              >
                <span>Auto-Fill</span>
                <Sparkles className="w-3 h-3 text-emerald-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {mode === 'login' ? 'Welcome Back • Quick Sign In' : 'Join Karnataka’s #1 Marketplace'}
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
          {/* Method Selector: Mobile OTP vs Password/Demo */}
          <div className="flex items-center justify-between text-xs pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp')
                  setOtpStep('phone')
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  authMethod === 'otp'
                    ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile OTP</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  authMethod === 'password'
                    ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password / Demo</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Instant access
            </span>
          </div>

          {/* Quick 1-Click Demo Fillers */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-0.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>1-Click Test Credentials:</span>
              </span>
              <span className="text-[10px] text-brand-500 font-semibold">Tap to Load</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_CHIPS.map(chip => (
                <button
                  key={chip.role}
                  type="button"
                  onClick={() => handleFillDemo(chip)}
                  className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-brand-500 text-left transition-all group flex flex-col justify-between shadow-xs active:scale-95"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{chip.icon}</span>
                    <span className="text-[8px] font-mono font-bold uppercase text-brand-500 px-1 rounded bg-brand-500/10">
                      {chip.role}
                    </span>
                  </div>
                  <p className="font-bold text-[10px] text-slate-900 dark:text-white truncate">
                    {chip.label.split(' ')[0]}
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono">
                    …{chip.phone.slice(-4)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ═════════ METHOD A: MOBILE OTP FLOW ═════════ */}
          {authMethod === 'otp' && (
            <div>
              {/* STEP 1: PHONE & DETAILS */}
              {otpStep === 'phone' && (
                <div className="space-y-4">
                  {/* If in Register mode, show Name & Role & District */}
                  {mode === 'register' && (
                    <>
                      {/* Account Type Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Choose Account Type *
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
                      10-Digit Mobile Number *
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
                      We'll send a 6-digit security OTP to verify this number.
                    </p>
                  </div>

                  {/* Send OTP CTA */}
                  <button
                    type="button"
                    disabled={loading || getCleanPhone().length < 10}
                    onClick={() => handleSendOtp('SMS')}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-2"
                  >
                    <span>
                      {loading
                        ? 'Dispatching OTP…'
                        : mode === 'login'
                        ? 'Get 6-Digit OTP to Sign In'
                        : 'Send Verification Code & Register'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: 6-DIGIT OTP VERIFICATION BOXES */}
              {otpStep === 'verify' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="text-center space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-block">
                      Security Code Sent
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Enter 6-Digit Verification Code
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dispatched to <span className="font-mono font-bold text-slate-800 dark:text-slate-200">+91 {getCleanPhone()}</span>
                      <button
                        type="button"
                        onClick={() => setOtpStep('phone')}
                        className="text-brand-500 font-bold ml-1.5 hover:underline"
                      >
                        (Edit)
                      </button>
                    </p>
                  </div>

                  {/* 6 Individual Digit Boxes */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
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

                  {/* Timer & Resend Controls */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="text-slate-500 dark:text-slate-400 font-mono">
                      {resendTimer > 0 ? (
                        <span>Resend code in <strong>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong></span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendOtp('SMS')}
                            className="font-bold text-brand-500 hover:underline flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" /> Resend SMS
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleSendOtp('WhatsApp')}
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Via WhatsApp
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const fallbackOtp = generatedOtp || '123456'
                        setOtpDigits(fallbackOtp.split(''))
                        verifyOtp(fallbackOtp)
                      }}
                      className="text-[11px] text-slate-400 hover:text-brand-500 underline"
                    >
                      Use Demo OTP
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
            </div>
          )}

          {/* ═════════ METHOD B: PASSWORD / DEMO FALLBACK ═════════ */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { r: 'customer' as Role, label: '👤 Customer' },
                        { r: 'provider' as Role, label: '👷 Service Partner' },
                      ].map(item => (
                        <button
                          key={item.r}
                          type="button"
                          onClick={() => setRole(item.r)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            role === item.r
                              ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98450 00000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-2"
              >
                <span>{loading ? 'Authenticating…' : mode === 'login' ? 'Sign In to Powerstar' : 'Create My Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Trust Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>RBI & NPCI Secure</span>
            </span>
            <span>•</span>
            <span>TRAI DLT Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
