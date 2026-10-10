import toast from 'react-hot-toast'

export interface RazorpayCheckoutParams {
  amount: number // in INR, e.g. 49
  bookingId: string
  bookingRef: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  description?: string
  onSuccess: (result: { paymentId: string; orderId: string; signature: string }) => void
  onDismiss?: () => void
  onError?: (errorMessage: string) => void
}

/**
 * Ensures Razorpay Checkout script is loaded
 */
export async function loadRazorpayScript(): Promise<boolean> {
  if ((window as any).Razorpay) return true

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Initiates Razorpay Standard Web Checkout
 */
export async function initiateRazorpayCheckout(params: RazorpayCheckoutParams) {
  try {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TmCAeyVSADDUn4'

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      toast.error('Razorpay SDK failed to load. Please check your internet connection.')
      params.onError?.('Razorpay script load error')
      return
    }

    const amountInPaise = Math.round(params.amount * 100)
    if (amountInPaise < 100) {
      toast.error('Minimum amount must be at least ₹1 (100 paise)')
      return
    }

    // Step 1: Call Backend to Create Order
    const orderRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `bkg_${params.bookingRef || params.bookingId}_${Date.now()}`.slice(0, 40)
      })
    })

    if (!orderRes.ok) {
      const errData = await orderRes.json().catch(() => ({}))
      const msg = errData.error || 'Failed to create Razorpay order'
      if (orderRes.status === 401 || msg.toLowerCase().includes('authentication')) {
        throw new Error('Razorpay Authentication: Please verify your Key ID & Secret in Razorpay Dashboard (API Keys).')
      }
      throw new Error(msg)
    }

    const { order_id, amount, currency } = await orderRes.json()

    // Step 2: Open Razorpay Standard Checkout Modal
    const options = {
      key: keyId,
      amount: amount,
      currency: currency || 'INR',
      name: 'POWERSTAR',
      description: params.description || `Booking #${params.bookingRef}`,
      image: 'https://powerstar-platform-4sap.vercel.app/icon.png',
      order_id: order_id,
      prefill: {
        name: params.customerName || 'Powerstar Customer',
        email: params.customerEmail || 'customer@powerstar.in',
        contact: params.customerPhone || '9845012345'
      },
      theme: {
        color: '#f97316' // Powerstar brand orange
      },
      modal: {
        ondismiss: () => {
          toast('Payment window closed', { icon: 'ℹ️' })
          params.onDismiss?.()
        }
      },
      handler: async (response: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) => {
        // Step 3: Backend Signature Verification
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          })

          const verifyData = await verifyRes.json().catch(() => ({}))

          if (verifyRes.ok && verifyData.success) {
            toast.success('Razorpay Payment Verified & Confirmed! 🎉')
            params.onSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            })
          } else {
            toast.error(verifyData.error || 'Payment signature verification failed!')
            params.onError?.(verifyData.error || 'Signature verification failed')
          }
        } catch (vErr: any) {
          toast.error(vErr?.message || 'Verification network error')
          params.onError?.(vErr?.message || 'Verification network error')
        }
      }
    }

    const rzp = new (window as any).Razorpay(options)

    rzp.on('payment.failed', (resp: any) => {
      const failReason = resp.error?.description || 'Payment failed or declined by bank'
      toast.error(`Payment Failed: ${failReason}`)
      params.onError?.(failReason)
    })

    rzp.open()
  } catch (err: any) {
    console.error('Razorpay Checkout initiation error:', err)
    toast.error(err?.message || 'Could not launch Razorpay checkout')
    params.onError?.(err?.message)
  }
}
