import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, CheckCircle2 } from 'lucide-react'
import { submitReview } from '@/services/api'
import toast from 'react-hot-toast'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    booking_ref: string
    customer_id: string
    provider_id: string
    provider?: { full_name?: string }
    category?: { name?: string; icon?: string }
  }
  onSubmitted: () => void
}

const FEEDBACK_TAGS = [
  '⚡ On-Time Arrival',
  '🛠️ Professional Work',
  '🤝 Polite & Courteous',
  '🧹 Cleaned Up After',
  '💰 Fair & Transparent',
  '⭐ Highly Recommended'
]

export default function ReviewModal({ isOpen, onClose, booking, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const fullComment = [
        selectedTags.length > 0 ? `[${selectedTags.join(', ')}]` : '',
        comment.trim()
      ].filter(Boolean).join(' ')

      const res = await submitReview({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        provider_id: booking.provider_id,
        rating,
        comment: fullComment || undefined
      })

      if (res.success) {
        setSubmitted(true)
        toast.success('Thank you for rating your service provider!')
        setTimeout(() => {
          onSubmitted()
          onClose()
        }, 1800)
      } else {
        toast.error(res.error || 'Failed to submit rating')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          className="w-full max-w-md bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-navy-700 p-6 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Rate Service Experience</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {booking.category?.name || 'Service'} • #{booking.booking_ref}
              </p>
            </div>
            {!submitted && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          {!submitted ? (
            <div className="py-5 space-y-5">
              {/* Provider Info */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-brand-500/10 border-2 border-brand-500 text-2xl flex items-center justify-center mx-auto mb-2">
                  👷
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {booking.provider?.full_name || 'Assigned Professional'}
                </h4>
                <p className="text-xs text-slate-400">How was the quality and speed of service?</p>
              </div>

              {/* Star Selector */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-navy-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Feedback Quick Tags */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">What went well?</p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-brand-500 text-white border-brand-500 font-semibold'
                            : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Leave additional notes or appreciation..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-sm shadow-brand hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting Review…' : `Submit ${rating}-Star Review`}
              </button>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">Review Submitted!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your feedback helps us maintain top service standards across Karnataka.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
