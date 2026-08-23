import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  booking?: { booking_ref?: string; category?: { name?: string; icon?: string } | null } | null
}

export default function ProviderReviews() {
  const { profile } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('reviews')
      .select('id,rating,comment,created_at,booking:bookings!reviews_booking_id_fkey(booking_ref,category:service_categories(name,icon))')
      .eq('provider_id', profile.id)
      .order('created_at', { ascending: false })

    if (queryError) {
      setError('Reviews could not be loaded right now.')
      setReviews([])
    } else {
      setReviews((data ?? []) as Review[])
    }
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { void load() }, [load])

  const average = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
  }, [reviews])

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="See what customers say about your work"
        action={<button className="btn btn-outline btn-sm" onClick={() => void load()} disabled={loading}>↻ Refresh</button>}
      />
      <div className="page-content">
        <div style={{ maxWidth: 760 }}>
          <div className="glass" style={{ padding: 22, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--brand)', fontWeight: 800 }}>
              {average ? average.toFixed(1) : '—'}
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 18 }}>Your customer rating</p>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
                {reviews.length ? `${reviews.length} verified review${reviews.length === 1 ? '' : 's'}` : 'Ratings will appear after completed jobs'}
              </p>
            </div>
            <div aria-label={`${average ? average.toFixed(1) : 0} out of 5 stars`} style={{ marginLeft: 'auto', color: '#d97706', fontSize: 22, letterSpacing: 2 }}>
              {average ? '★★★★★' : '☆☆☆☆☆'}
            </div>
          </div>

          {loading ? (
            <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>Loading reviews…</div>
          ) : error ? (
            <div className="glass" style={{ padding: 36, textAlign: 'center' }} role="alert">
              <p style={{ fontSize: 30, marginBottom: 10 }}>⚠️</p>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>{error}</p>
              <button className="btn btn-outline btn-sm" onClick={() => void load()}>Try again</button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 38, marginBottom: 10 }}>⭐</p>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>No reviews yet</p>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Complete great work and customer feedback will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(review => {
                const category = review.booking?.category
                return (
                  <article className="glass" key={review.id} style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <Avatar name="Verified customer" size={40} color="#f97316" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14 }}>Verified customer</p>
                            <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 2 }}>
                              {category?.icon ?? '🧾'} {category?.name ?? 'Completed service'}
                            </p>
                          </div>
                          <time dateTime={review.created_at} style={{ color: 'var(--text3)', fontSize: 11 }}>
                            {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </time>
                        </div>
                        <div aria-label={`${review.rating} out of 5 stars`} style={{ color: '#d97706', marginTop: 10, letterSpacing: 2 }}>{'★'.repeat(review.rating)}{'☆'.repeat(Math.max(0, 5 - review.rating))}</div>
                        {review.comment && <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>{review.comment}</p>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
