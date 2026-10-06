import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Info,
  Sparkles,
  Zap,
  Check
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ALL_SERVICES, MANPOWER, VEHICLES, RTO, FINANCIAL, Service, calcPrice } from '@/data/services'
import { DISTRICTS, getCities } from '@/data/karnataka'
import { createBooking } from '@/services/api'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

const TIME_SLOTS = [
  { id: 'immediate', label: '⚡ Urgent / Next 45 Mins', sub: 'Instant Dispatch' },
  { id: 'morning_1', label: '08:00 AM - 10:00 AM', sub: 'Morning Slot' },
  { id: 'morning_2', label: '10:00 AM - 12:00 PM', sub: 'Late Morning' },
  { id: 'afternoon_1', label: '12:00 PM - 03:00 PM', sub: 'Afternoon Slot' },
  { id: 'evening_1', label: '03:00 PM - 06:00 PM', sub: 'Evening Slot' },
  { id: 'night_1', label: '06:00 PM - 09:00 PM', sub: 'Night Slot' },
]

export default function CustomerBook() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  const defaultCategoryParam = searchParams.get('category')
  const initialService = ALL_SERVICES.find(s => s.id === defaultCategoryParam) || ALL_SERVICES[0]

  // Multi-step state (1 to 5)
  const [step, setStep] = useState(1)

  // Step 1: Service
  const [selectedService, setSelectedService] = useState<Service>(initialService)
  const [serviceTypeTab, setServiceTypeTab] = useState<'manpower' | 'vehicle' | 'rto' | 'financial'>(initialService.type)
  const [hours, setHours] = useState(2)

  // Step 2: Date & Time
  const [scheduleDate, setScheduleDate] = useState<'today' | 'tomorrow' | 'custom'>('today')
  const [customDate, setCustomDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0].label)

  // Step 3: Location
  const [district, setDistrict] = useState(profile?.district || 'Bengaluru Urban')
  const [city, setCity] = useState(profile?.city || 'Koramangala')
  const [address, setAddress] = useState(profile?.address || '')
  const [landmark, setLandmark] = useState('')
  const [contactPhone, setContactPhone] = useState(profile?.phone || '')

  // Step 4: Notes
  const [requirements, setRequirements] = useState('')

  // Step 5 & Submitting
  const [submitting, setSubmitting] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<any>(null)

  useEffect(() => {
    if (defaultCategoryParam) {
      const match = ALL_SERVICES.find(s => s.id === defaultCategoryParam)
      if (match) {
        setSelectedService(match)
        setServiceTypeTab(match.type)
      }
    }
  }, [defaultCategoryParam])

  // Calculate pricing
  const pricing = selectedService.type === 'vehicle' || selectedService.type === 'rto' || selectedService.type === 'financial'
    ? calcPrice(selectedService.basePrice, 1)
    : calcPrice(selectedService.basePrice, hours)

  const currentDistrictObj = DISTRICTS.find(d => d.name === district) || DISTRICTS[0]
  const cities = getCities(currentDistrictObj.id)

  const STEPS = [
    { num: 1, title: 'Service' },
    { num: 2, title: 'Schedule' },
    { num: 3, title: 'Location' },
    { num: 4, title: 'Instructions' },
    { num: 5, title: 'Review' },
  ]

  function handleNext() {
    if (step === 3) {
      if (!address.trim()) {
        toast.error('Please enter street / house address')
        return
      }
      if (!contactPhone.trim()) {
        toast.error('Please provide a contact phone number')
        return
      }
    }
    setStep(prev => Math.min(prev + 1, 5))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmitBooking() {
    if (!profile?.id) {
      toast.error('Please sign in to complete booking')
      nav('/auth')
      return
    }

    setSubmitting(true)
    try {
      const resolvedDate =
        scheduleDate === 'today'
          ? 'Today'
          : scheduleDate === 'tomorrow'
          ? 'Tomorrow'
          : customDate || 'Scheduled'

      const scheduledAtString = `${resolvedDate} (${selectedTimeSlot})`

      const payload = {
        customer_id: profile.id,
        category_slug: selectedService.id,
        address: `${address}${landmark ? `, Near ${landmark}` : ''}`,
        city: city || currentDistrictObj.name,
        district: district,
        scheduled_at: scheduledAtString,
        base_amount: pricing.base,
        platform_fee: pricing.fee,
        gst_amount: pricing.gst,
        total_amount: pricing.total,
        customer_notes: requirements || undefined
      }

      const res = await createBooking(payload)

      if (res.booking) {
        setCreatedBooking(res.booking)
        setStep(6) // Success confirmation view
        toast.success('Booking request submitted to Powerstar admin!')
      } else {
        toast.error(res.error || 'Could not submit booking request')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Booking submission error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── SUCCESS CONFIRMATION SCREEN (STEP 6) ──
  if (step === 6 && createdBooking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-20">
        <HeaderBar title="Booking Request Submitted" showLocation={false} />

        <main className="max-w-lg mx-auto px-4 py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl text-center space-y-5"
          >
            {/* Animated Check icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-block mb-2">
                Pending Admin Assignment
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">
                Request Received!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Powerstar admin is reviewing your requirements and assigning the best verified service professional in your area.
              </p>
            </div>

            {/* Booking Reference Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700/80 text-left space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-700">
                <span className="text-xs text-slate-400 font-medium">Booking Reference</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  #{createdBooking.booking_ref}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Service</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedService.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{district} ({city})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Advance Visiting Fee</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{pricing.total} (Online UPI)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Estimated Work Rate</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₹{pricing.estimatedWorkCost} (Paid on-site)</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400">Provider Selection</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Assigned by Powerstar
                </span>
              </div>
            </div>

            {/* Next Step Info */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-left flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
              <span>
                <strong>What happens next?</strong> Powerstar admin assigns your technician. You only pay the nominal ₹49 advance fee via UPI to confirm. The technician inspects the work on-site and the remaining service fee is paid after job completion.
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => nav('/dashboard/track')}
                className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2"
              >
                <span>Track Booking Status Live</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => nav('/dashboard')}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Book a Service" subtitle="Professional assigned by Powerstar" showLocation={false} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* ── PROGRESS STEP INDICATOR ── */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200/80 dark:border-navy-800 shadow-subtle">
          <div className="flex items-center justify-between relative">
            {STEPS.map((s, idx) => {
              const isPassed = step > s.num
              const isCurrent = step === s.num
              return (
                <div key={s.num} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-brand-500 text-white shadow-brand ring-4 ring-brand-500/20 font-extrabold'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] mt-1 tracking-tight truncate ${
                      isCurrent
                        ? 'font-bold text-brand-600 dark:text-brand-400'
                        : isPassed
                        ? 'font-medium text-slate-700 dark:text-slate-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── STEP CONTENT ── */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-card">
          {/* ════════ STEP 1: SERVICE SELECTION ════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Choose Service & Specifications</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select the category of work needed</p>
              </div>

              {/* Service Type Switcher */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-navy-800 rounded-2xl text-xs font-semibold">
                {[
                  { id: 'manpower', label: '👷 Manpower' },
                  { id: 'vehicle', label: '🚛 Vehicles' },
                  { id: 'rto', label: '📋 RTO' },
                  { id: 'financial', label: '💰 Financial' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setServiceTypeTab(t.id as any)
                      const firstOfType = ALL_SERVICES.find(s => s.type === t.id)
                      if (firstOfType) setSelectedService(firstOfType)
                    }}
                    className={`py-2 rounded-xl transition-all ${
                      serviceTypeTab === t.id
                        ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Service Grid Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {ALL_SERVICES.filter(s => s.type === serviceTypeTab).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedService(s)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      selectedService.id === s.id
                        ? 'bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                        : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{s.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                      ₹{s.basePrice}{s.unit}
                    </span>
                  </button>
                ))}
              </div>

              {/* Selected Service Card Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/70 border border-slate-200 dark:border-navy-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedService.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedService.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedService.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{pricing.total} Advance
                    </span>
                    <span className="text-[10px] text-slate-400 block">+ ₹{pricing.estimatedWorkCost} on-site</span>
                  </div>
                </div>

                {/* Duration Picker for hourly manpower */}
                {selectedService.type === 'manpower' && selectedService.unit.includes('hr') && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-navy-700 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Estimated Duration:
                    </span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 4, 8].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHours(h)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                            hours === h
                              ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                              : 'bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700'
                          }`}
                        >
                          {h} hr{h > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ STEP 2: DATE & TIME ════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Select Date & Preferred Time</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">When should the professional arrive?</p>
              </div>

              {/* Date Options */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'today', label: 'Today', sub: 'Immediate availability' },
                  { id: 'tomorrow', label: 'Tomorrow', sub: 'Scheduled morning/eve' },
                  { id: 'custom', label: 'Pick Date', sub: 'Select future date' },
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setScheduleDate(d.id as any)}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      scheduleDate === d.id
                        ? 'bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{d.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{d.sub}</p>
                  </button>
                ))}
              </div>

              {scheduleDate === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Choose Date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Time Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot.label)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        selectedTimeSlot === slot.label
                          ? 'bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                          : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{slot.label}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{slot.sub}</p>
                      </div>
                      {selectedTimeSlot === slot.label && (
                        <Check className="w-4 h-4 text-brand-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 3: LOCATION & CONTACT ════════ */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Service Address & Location</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Where should the service be conducted?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={e => {
                      setDistrict(e.target.value)
                      const dObj = DISTRICTS.find(d => d.name === e.target.value)
                      if (dObj) {
                        const cl = getCities(dObj.id)
                        setCity(cl[0] || e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>{d.name} {d.nameKn ? `(${d.nameKn})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Area / City
                  </label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Complete Street / Building Address *
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Flat / House No., Building Name, Street / Cross Road..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="e.g. Near Metro / Hospital"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+91 98450 00000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 4: SPECIAL INSTRUCTIONS ════════ */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Service Instructions & Notes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add any specific details or tool requirements</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Describe what needs fixing or specific task details
                </label>
                <textarea
                  rows={4}
                  value={requirements}
                  onChange={e => setRequirements(e.target.value)}
                  placeholder="e.g. Need 2 ceiling fans installed and switchboard repair in master bedroom. Ladder available at home."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Admin Provider Matching Guarantee</p>
                  <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                    Our dispatch manager reviews these notes to assign the best matching specialist with the right tools.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 5: REVIEW & CONFIRM ════════ */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Review Booking Request</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Confirm details before submitting to admin</p>
              </div>

              {/* Service & Reassurance banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedService.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedService.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {district} • {city}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-slate-900 dark:text-white">Assigned by Powerstar</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Admin Dispatch</span>
                </div>
              </div>

              {/* Schedule & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
                  <span className="text-slate-400 font-medium block mb-1">📅 Schedule</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {scheduleDate === 'today' ? 'Today' : scheduleDate === 'tomorrow' ? 'Tomorrow' : customDate}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{selectedTimeSlot}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
                  <span className="text-slate-400 font-medium block mb-1">📍 Address & Phone</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{address || 'Address provided'}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{contactPhone || profile?.phone}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Nominal Visiting & Platform Fee</span>
                  <span>₹{pricing.base}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST (18% on Visiting Fee)</span>
                  <span>₹{pricing.gst}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-navy-700 flex justify-between items-baseline font-bold text-sm text-slate-900 dark:text-white">
                  <span>Payable Online (Advance Booking Fee)</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{pricing.total}</span>
                </div>

                <div className="mt-2 pt-2.5 border-t border-dashed border-slate-200 dark:border-navy-700 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Estimated Work Rate (Paid on-site):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{pricing.estimatedWorkCost}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                  🛡️ <strong>Customer Friendly Guarantee:</strong> Pay only ₹{pricing.total} now to confirm your visit. The technician will inspect the actual work on arrival and the remaining service charges are paid directly after service completion!
                </div>
              </div>
            </div>
          )}

          {/* ── FOOTER WIZARD CONTROLS ── */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitBooking}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <span>{submitting ? 'Submitting Request…' : 'CONFIRM BOOKING REQUEST'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
