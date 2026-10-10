import crypto from 'crypto'

export default async function handler(req, res) {
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature'
      })
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_secret) {
      return res.status(401).json({ success: false, error: 'Razorpay secret key not configured' })
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const signPayload = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(signPayload)
      .digest('hex')

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8')
    const receivedBuffer = Buffer.from(razorpay_signature, 'utf-8')

    const isMatch =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer)

    if (isMatch) {
      return res.status(200).json({
        success: true,
        message: 'Payment signature verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      })
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Payment verification failed.'
      })
    }
  } catch (error) {
    console.error('Razorpay verify-payment error:', error)
    return res.status(500).json({
      success: false,
      error: error?.message || 'Payment verification failed'
    })
  }
}
