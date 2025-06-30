import { Resend } from 'resend'
import type { Consultant, Client, Commission } from '@/types/consultant'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOTPEmail(email: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Ferreiras ME <noreply@ferreirasme.pt>',
      to: [email],
      subject: 'Código de Verificação - Ferreiras ME',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td align="center" style="padding: 40px 20px; border-bottom: 1px solid #e5e7eb;">
                        <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">Ferreiras ME</h1>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Semijoias Exclusivas</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">Código de Verificação</h2>
                        <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                          Use o código abaixo para fazer login em sua conta:
                        </p>
                        
                        <!-- OTP Code -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 30px; background-color: #f3f4f6; border-radius: 8px;">
                              <div style="font-size: 36px; font-weight: bold; color: #111827; letter-spacing: 8px;">${otp}</div>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                          Este código expira em <strong>10 minutos</strong>.
                        </p>
                        
                        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                          Se você não solicitou este código, pode ignorar este email com segurança.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                          © ${new Date().getFullYear()} Ferreiras ME. Todos os direitos reservados.
                        </p>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                          Este é um email automático, por favor não responda.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending OTP email:', error)
    return { success: false, error }
  }
}

export async function sendShippingNotificationEmail(
  email: string,
  orderNumber: string,
  trackingCode: string,
  customerName: string,
  shippingMethod: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Ferreiras ME <noreply@ferreirasme.pt>',
      to: [email],
      subject: `Seu pedido ${orderNumber} foi enviado! - Ferreiras ME`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td align="center" style="padding: 40px 20px; border-bottom: 1px solid #e5e7eb;">
                        <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">Ferreiras ME</h1>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Semijoias Exclusivas</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">
                          Olá ${customerName}, seu pedido foi enviado! 📦
                        </h2>
                        
                        <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                          Temos boas notícias! Seu pedido <strong>#${orderNumber}</strong> foi despachado e está a caminho.
                        </p>
                        
                        <!-- Tracking Info -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td style="padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">
                                Informações de Rastreamento
                              </h3>
                              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">
                                <strong>Código de Rastreamento:</strong> ${trackingCode}
                              </p>
                              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">
                                <strong>Método de Envio:</strong> ${shippingMethod === 'EXPRESSO' ? 'CTT Expresso' : 'CTT Normal'}
                              </p>
                              <p style="margin: 0; color: #4b5563; font-size: 14px;">
                                <strong>Prazo estimado:</strong> ${shippingMethod === 'EXPRESSO' ? '1-2 dias úteis' : '3-5 dias úteis'}
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Track Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx?reference=${trackingCode}" 
                                 style="display: inline-block; padding: 12px 30px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                                Rastrear Encomenda
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                          <strong>Dica:</strong> Pode rastrear sua encomenda a qualquer momento usando o código acima no site dos CTT.
                        </p>
                        
                        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                          Se tiver alguma dúvida sobre seu pedido, não hesite em nos contactar.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                          © ${new Date().getFullYear()} Ferreiras ME. Todos os direitos reservados.
                        </p>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                          Este é um email automático, por favor não responda.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending shipping notification email:', error)
    return { success: false, error }
  }
}

// Template de boas-vindas para consultoras
export async function sendConsultantWelcomeEmail(
  consultant: Consultant,
  temporaryPassword?: string
) {
  try {
    const ConsultantWelcome = (await import('@/components/emails/ConsultantWelcome')).default
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Ferreiras ME <noreply@ferreirasme.pt>',
      to: [consultant.email],
      subject: 'Bem-vinda à equipe Ferreiras ME!',
      react: ConsultantWelcome({
        consultant,
        temporaryPassword,
        unsubscribeLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/preferences?token=${consultant.id}`
      })
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending consultant welcome email:', error)
    return { success: false, error }
  }
}

// Template de nova comissão
export async function sendNewCommissionEmail(
  consultant: Consultant,
  commission: Commission
) {
  try {
    const NewCommission = (await import('@/components/emails/NewCommission')).default
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Ferreiras ME <noreply@ferreirasme.pt>',
      to: [consultant.email],
      subject: `Nova comissão registrada - Pedido #${commission.orderDetails.orderNumber}`,
      react: NewCommission({
        consultant,
        commission,
        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/dashboard`,
        unsubscribeLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/preferences?token=${consultant.id}`
      })
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending new commission email:', error)
    return { success: false, error }
  }
}

// Template de aprovação de pagamento
export async function sendPaymentApprovedEmail(
  consultant: Consultant,
  commission: Commission
) {
  try {
    const PaymentApproved = (await import('@/components/emails/PaymentApproved')).default
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Ferreiras ME <noreply@ferreirasme.pt>',
      to: [consultant.email],
      subject: 'Pagamento de comissão aprovado',
      react: PaymentApproved({
        consultant,
        commission,
        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/dashboard`,
        unsubscribeLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/preferences?token=${consultant.id}`
      })
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending payment approved email:', error)
    return { success: false, error }
  }
}

// Template de nova cliente vinculada
export async function sendNewClientLinkedEmail(
  consultant: Consultant,
  client: Client
) {
  try {
    const NewClientLinked = (await import('@/components/emails/NewClientLinked')).default
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Ferreiras ME <noreply@ferreirasme.pt>',
      to: [consultant.email],
      subject: 'Nova cliente vinculada à sua conta',
      react: NewClientLinked({
        consultant,
        client,
        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/dashboard`,
        unsubscribeLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/preferences?token=${consultant.id}`
      })
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending new client linked email:', error)
    return { success: false, error }
  }
}

// Template de resumo mensal
export async function sendMonthlyReportEmail(
  consultant: Consultant,
  reportData: {
    month: string
    year: number
    totalCommissions: number
    totalEarnings: number
    newClients: number
    topClients: Array<Client & { totalSpent: number }>
    commissions: Commission[]
  }
) {
  try {
    const MonthlyReport = (await import('@/components/emails/MonthlyReport')).default
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Ferreiras ME <noreply@ferreirasme.pt>',
      to: [consultant.email],
      subject: `Resumo mensal - ${reportData.month}/${reportData.year}`,
      react: MonthlyReport({
        consultant,
        reportData,
        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/dashboard`,
        unsubscribeLink: `${process.env.NEXT_PUBLIC_APP_URL}/consultant/preferences?token=${consultant.id}`
      })
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending monthly report email:', error)
    return { success: false, error }
  }
}