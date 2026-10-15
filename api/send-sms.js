import https from 'https'

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'nzhfm8Wc10ag6l47R5ETHQVedksJGbyNOFuIoiPDXpArKBtYSxUcGyhBxaV1uRKSldFY5ojO2C0r7JEf'

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
    const { phone, otp } = body || {}

    const clean10 = (phone || '').replace(/\D/g, '').slice(-10)
    if (!clean10 || clean10.length !== 10) {
      return res.status(400).json({ error: 'Invalid 10-digit mobile number' })
    }

    if (!otp) {
      return res.status(400).json({ error: 'OTP code required' })
    }

    // Call Fast2SMS
    const postData = JSON.stringify({
      variables_values: otp,
      route: 'otp',
      numbers: clean10
    })

    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const fast2smsReq = https.request(options, (fast2smsRes) => {
      let data = ''
      fast2smsRes.on('data', chunk => data += chunk)
      fast2smsRes.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.return) {
            return res.status(200).json({
              success: true,
              message: 'SMS sent successfully',
              sentViaSms: true
            })
          } else {
            // Fast2SMS returned requirement message (e.g. ₹100 transaction or website verification)
            return res.status(200).json({
              success: true,
              sentViaSms: false,
              notice: parsed.message || 'SMS gateway pending activation'
            })
          }
        } catch (e) {
          return res.status(200).json({ success: true, sentViaSms: false })
        }
      })
    })

    fast2smsReq.on('error', (err) => {
      console.error('Fast2SMS network error:', err)
      return res.status(200).json({ success: true, sentViaSms: false, error: err.message })
    })

    fast2smsReq.write(postData)
    fast2smsReq.end()
  } catch (err) {
    console.error('send-sms handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
