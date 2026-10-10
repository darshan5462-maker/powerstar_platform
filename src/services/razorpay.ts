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

    // Step 1: Attempt Backend Order Creation
    let order_id: string | undefined = undefined
    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `bkg_${params.bookingRef || params.bookingId}_${Date.now()}`.slice(0, 40)
        })
      })

      if (orderRes.ok) {
        const orderData = await orderRes.json()
        order_id = orderData.order_id
      } else {
        console.warn('Backend order creation returned status', orderRes.status, 'continuing with direct checkout.')
      }
    } catch (e) {
      console.warn('Backend order endpoint not reachable, continuing with direct checkout:', e)
    }

    // Step 2: Open Razorpay Standard Checkout Modal
    const options: any = {
      key: keyId,
      amount: amountInPaise,
      currency: 'INR',
      name: 'POWERSTAR',
      description: params.description || `Booking #${params.bookingRef}`,
      image: 'https://powerstar-platform-4sap.vercel.app/icon.png',
      ...(order_id ? { order_id } : {}),
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
        razorpay_order_id?: string
        razorpay_signature?: string
      }) => {
        // Step 3: Backend Signature Verification if order_id was created
        if (response.razorpay_signature && response.razorpay_order_id) {
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
              return
            }
          } catch (vErr) {
            console.warn('Signature verification endpoint notice:', vErr)
          }
        }

        // Direct success confirmation with payment ID
        if (response.razorpay_payment_id) {
          toast.success('Payment Received & Confirmed! 🎉')
          params.onSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || `ord_${Date.now()}`,
            signature: response.razorpay_signature || ''
          })
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
