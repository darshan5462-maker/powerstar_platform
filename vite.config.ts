import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import Razorpay from 'razorpay'
import crypto from 'crypto'

function razorpayDevApiPlugin(env: Record<string, string>) {
  return {
    name: 'razorpay-dev-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/create-order' && req.method === 'POST') {
          let bodyStr = ''
          req.on('data', (chunk: any) => { bodyStr += chunk })
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}')
              const amountInPaise = Math.round(Number(body.amount))
              if (!amountInPaise || amountInPaise < 100) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ error: 'Amount must be at least 100 paise (₹1)' }))
              }

              const key_id = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
              const key_secret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET
              if (!key_id || !key_secret) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ error: 'Razorpay credentials not configured' }))
              }

              const razorpay = new Razorpay({ key_id, key_secret })
              const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: body.currency || 'INR',
                receipt: body.receipt || `rcpt_${Date.now()}`
              })

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({
                order_id: order.id,
                amount: order.amount,
                currency: order.currency
              }))
            } catch (err: any) {
              const statusCode = err?.statusCode || 500
              const errMsg = err?.error?.description || err?.message || 'Failed to create order'
              res.statusCode = statusCode
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: errMsg }))
            }
          })
          return
        }

        if (url === '/api/verify-payment' && req.method === 'POST') {
          let bodyStr = ''
          req.on('data', (chunk: any) => { bodyStr += chunk })
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}')
              const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
              if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ success: false, error: 'Missing required parameters' }))
              }

              const key_secret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET
              if (!key_secret) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ success: false, error: 'Razorpay secret key not configured' }))
              }

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
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({
                  success: true,
                  message: 'Payment signature verified successfully',
                  payment_id: razorpay_payment_id,
                  order_id: razorpay_order_id
                }))
              } else {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({
                  success: false,
                  error: 'Invalid payment signature. Payment verification failed.'
                }))
              }
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: false, error: err?.message || 'Payment verification failed' }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), razorpayDevApiPlugin(env)],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react:    ['react','react-dom','react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui:       ['react-hot-toast','framer-motion'],
          }
        }
      }
    },
    server: {
      port: 5173,
    }
  }
})
