export async function sendLeaveNotification(
  staffName: string,
  leaveType: string,
  startDate: string,
  endDate: string
) {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock'
  const apiKey = process.env.WHATSAPP_API_KEY
  const apiUrl = process.env.WHATSAPP_API_URL
  const fromNumber = process.env.WHATSAPP_FROM_NUMBER
  const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '+60123456789'
  
  const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`
  const dashboardLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/leave`
  const message = `🔔 New leave request from ${staffName} — ${leaveType} — ${dateRange}. Review in dashboard: ${dashboardLink}`

  console.log(`[Notification Service] Attempting to send message via provider "${provider}"...`)

  if (provider === 'mock' || !apiKey) {
    console.log(`
============================================================
[MOCK WHATSAPP NOTIFICATION]
To: ${adminNumber}
Message: ${message}
============================================================
`)
    return { success: true, provider: 'mock', logged: true }
  }

  try {
    if (provider === 'twilio') {
      // Stub for Twilio API call
      // Requires: Account SID in API URL, Auth Token in API Key, and From/To numbers.
      const res = await fetch(apiUrl || 'https://api.twilio.com/2010-04-01/Accounts/.../Messages.json', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`AC...:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${fromNumber}`,
          To: `whatsapp:${adminNumber}`,
          Body: message,
        }),
      })
      const data = await res.json()
      return { success: res.ok, response: data }
    }

    if (provider === 'whapi') {
      const res = await fetch(apiUrl || 'https://gate.whapi.cloud/messages/text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: adminNumber.replace('+', ''),
          body: message,
        }),
      })
      const data = await res.json()
      return { success: res.ok, response: data }
    }

    if (provider === 'wablas') {
      const res = await fetch(apiUrl || 'https://api.wablas.com/api/send-message', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          phone: adminNumber.replace('+', ''),
          message: message,
        }),
      })
      const data = await res.json()
      return { success: res.ok, response: data }
    }

    // Default fallback
    console.warn(`[Notification Service] Provider "${provider}" is not implemented. Falling back to log.`)
    return { success: false, error: 'Provider not supported' }
  } catch (error) {
    console.error('[Notification Service] Error sending WhatsApp message:', error)
    return { success: false, error: String(error) }
  }
}
