type TicketNotification = {
  fullName: string
  whatsapp: string
  raffleName: string
  ticketNumbers: number[]
}

export type WhatsAppResult =
  | { status: 'sent'; messageId?: string }
  | { status: 'unconfigured'; error: string }
  | { status: 'failed'; error: string }

export async function sendTicketNotification(input: TicketNotification): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const templateName = process.env.WHATSAPP_TICKET_TEMPLATE
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0'

  if (!token || !phoneNumberId) {
    return { status: 'unconfigured', error: 'Faltan las credenciales de WhatsApp Business.' }
  }

  const ticketList = input.ticketNumbers.map(number => String(number).padStart(6, '0')).join(', ')
  const lookupUrl = 'https://sorteos.impactoperu.net/mis-tickets'
  const body = templateName
    ? {
        messaging_product: 'whatsapp',
        to: input.whatsapp,
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: input.fullName },
              { type: 'text', text: input.raffleName },
              { type: 'text', text: ticketList },
              { type: 'text', text: lookupUrl },
            ],
          }],
        },
      }
    : {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: input.whatsapp,
        type: 'text',
        text: {
          preview_url: true,
          body: `Hola ${input.fullName}. IMPACTO validó tu pago para ${input.raffleName}. Tus tickets son: ${ticketList}. Consúltalos en ${lookupUrl}`,
        },
      }

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    if (!response.ok) return { status: 'failed', error: result?.error?.message || 'WhatsApp rechazó el mensaje.' }
    return { status: 'sent', messageId: result?.messages?.[0]?.id }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : 'No se pudo conectar con WhatsApp.' }
  }
}
