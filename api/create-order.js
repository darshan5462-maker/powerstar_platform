import Razorpay from 'razorpay'

export default async function handler(req, res) {
  // Support CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (e) {}
    }
    const { amount, currency = 'INR', receipt } = body || {}

    const amountInPaise = Math.round(Number(amount))
    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1)' })
    }

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      return res.status(401).json({ error: 'Razorpay credentials not configured' })
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    })

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`
    }

    const order = await razorpay.orders.create(options)

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    })
  } catch (error) {
    console.error('Razorpay create-order error:', error)
    const statusCode = error?.statusCode || 500
    const errMsg = error?.error?.description || error?.message || 'Failed to create Razorpay order'
    return res.status(statusCode).json({
      error: errMsg
    })
  }
}
