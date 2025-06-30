import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Hr,
} from '@react-email/components'
import type { Consultant, Commission } from '@/types/consultant'

interface PaymentApprovedProps {
  consultant: Consultant
  commission: Commission
  dashboardLink: string
  unsubscribeLink: string
}

export default function PaymentApproved({
  consultant,
  commission,
  dashboardLink,
  unsubscribeLink,
}: PaymentApprovedProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Html>
      <Head />
      <Preview>Pagamento de comissão aprovado!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Ferreiras ME</Text>
            <Text style={subtitle}>Semijoias Exclusivas</Text>
          </Section>

          <Section style={content}>
            <Section style={celebrationBox}>
              <Text style={celebrationIcon}>🎉</Text>
              <Text style={celebrationText}>Pagamento Aprovado!</Text>
            </Section>

            <Text style={heading}>
              Olá {consultant.firstName}, temos ótimas notícias!
            </Text>

            <Text style={paragraph}>
              O pagamento da sua comissão referente ao pedido #{commission.orderDetails.orderNumber} 
              foi aprovado e será processado em breve.
            </Text>

            <Section style={paymentBox}>
              <Text style={paymentTitle}>Detalhes do Pagamento</Text>
              
              <table style={table}>
                <tr>
                  <td style={tableLabel}>Pedido:</td>
                  <td style={tableValue}>#{commission.orderDetails.orderNumber}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Cliente:</td>
                  <td style={tableValue}>{commission.orderDetails.customerName}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Data de Aprovação:</td>
                  <td style={tableValue}>
                    {commission.approvalDate ? formatDate(commission.approvalDate) : 'Hoje'}
                  </td>
                </tr>
                <tr>
                  <td style={tableLabelHighlight}>Valor Aprovado:</td>
                  <td style={tableValueHighlight}>
                    {formatCurrency(commission.commissionAmount)}
                  </td>
                </tr>
              </table>
            </Section>

            <Section style={bankInfoBox}>
              <Text style={bankInfoTitle}>Dados Bancários Cadastrados:</Text>
              <Text style={bankInfoText}>
                <strong>IBAN:</strong> {consultant.iban.replace(/(.{4})/g, '$1 ').trim()}
              </Text>
              {consultant.bankName && (
                <Text style={bankInfoText}>
                  <strong>Banco:</strong> {consultant.bankName}
                </Text>
              )}
            </Section>

            <Section style={timelineBox}>
              <Text style={timelineTitle}>Próximos Passos:</Text>
              <ul style={timelineList}>
                <li style={timelineItem}>
                  <strong>Processamento:</strong> O pagamento será processado nos próximos 2-3 dias úteis
                </li>
                <li style={timelineItem}>
                  <strong>Transferência:</strong> O valor será creditado em sua conta bancária
                </li>
                <li style={timelineItem}>
                  <strong>Confirmação:</strong> Você receberá uma confirmação quando o pagamento for concluído
                </li>
              </ul>
            </Section>

            <Button style={button} href={dashboardLink}>
              Ver Detalhes no Dashboard
            </Button>

            <Text style={helpText}>
              Se tiver alguma dúvida sobre o pagamento, entre em contacto com 
              nosso suporte para consultoras.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Ferreiras ME. Todos os direitos
              reservados.
            </Text>
            <Text style={footerText}>
              Este email foi enviado para {consultant.email} porque você é uma
              consultora ativa Ferreiras ME.
            </Text>
            <Link href={unsubscribeLink} style={unsubscribeLink}>
              Gerenciar preferências de email
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '40px',
}

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0',
}

const subtitle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '5px 0 0 0',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '40px 30px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
}

const celebrationBox = {
  textAlign: 'center' as const,
  marginBottom: '30px',
}

const celebrationIcon = {
  fontSize: '48px',
  margin: '0',
}

const celebrationText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#059669',
  margin: '10px 0 0 0',
}

const heading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '20px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  marginBottom: '20px',
}

const paymentBox = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
  border: '1px solid #86efac',
}

const paymentTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#166534',
  marginBottom: '15px',
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const tableLabel = {
  fontSize: '14px',
  color: '#15803d',
  padding: '8px 0',
  width: '40%',
}

const tableValue = {
  fontSize: '14px',
  color: '#166534',
  padding: '8px 0',
  fontWeight: '500',
}

const tableLabelHighlight = {
  fontSize: '14px',
  color: '#166534',
  padding: '12px 0 8px 0',
  fontWeight: '600',
  borderTop: '1px solid #86efac',
}

const tableValueHighlight = {
  fontSize: '18px',
  color: '#059669',
  padding: '12px 0 8px 0',
  fontWeight: '700',
  borderTop: '1px solid #86efac',
}

const bankInfoBox = {
  backgroundColor: '#f3f4f6',
  padding: '15px',
  borderRadius: '8px',
  marginBottom: '20px',
}

const bankInfoTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '10px',
}

const bankInfoText = {
  fontSize: '13px',
  color: '#4b5563',
  marginBottom: '5px',
}

const timelineBox = {
  marginBottom: '30px',
}

const timelineTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '10px',
}

const timelineList = {
  paddingLeft: '20px',
  margin: '0',
}

const timelineItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#4b5563',
  marginBottom: '8px',
}

const button = {
  backgroundColor: '#059669',
  color: '#ffffff',
  padding: '12px 30px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
  marginBottom: '20px',
}

const helpText = {
  fontSize: '14px',
  color: '#6b7280',
  marginBottom: '0',
}

const divider = {
  borderColor: '#e5e7eb',
  marginTop: '40px',
  marginBottom: '30px',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  marginBottom: '10px',
}

const unsubscribeLink = {
  fontSize: '12px',
  color: '#6b7280',
  textDecoration: 'underline',
}