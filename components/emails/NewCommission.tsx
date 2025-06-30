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

interface NewCommissionProps {
  consultant: Consultant
  commission: Commission
  dashboardLink: string
  unsubscribeLink: string
}

export default function NewCommission({
  consultant,
  commission,
  dashboardLink,
  unsubscribeLink,
}: NewCommissionProps) {
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
      <Preview>Nova comissão registrada - Pedido #{commission.orderDetails.orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Ferreiras ME</Text>
            <Text style={subtitle}>Semijoias Exclusivas</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>
              Olá {consultant.firstName}, temos boas notícias!
            </Text>

            <Text style={paragraph}>
              Uma nova comissão foi registrada em sua conta referente ao pedido
              #{commission.orderDetails.orderNumber}.
            </Text>

            <Section style={commissionBox}>
              <Text style={commissionTitle}>Detalhes da Comissão</Text>
              
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
                  <td style={tableLabel}>Data do Pedido:</td>
                  <td style={tableValue}>{formatDate(commission.orderDate)}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Valor do Pedido:</td>
                  <td style={tableValue}>{formatCurrency(commission.orderAmount)}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Taxa de Comissão:</td>
                  <td style={tableValue}>{commission.commissionRate}%</td>
                </tr>
                <tr>
                  <td style={tableLabelHighlight}>Valor da Comissão:</td>
                  <td style={tableValueHighlight}>
                    {formatCurrency(commission.commissionAmount)}
                  </td>
                </tr>
              </table>
            </Section>

            <Section style={itemsSection}>
              <Text style={itemsTitle}>Itens do Pedido:</Text>
              {commission.orderDetails.items.map((item, index) => (
                <div key={index} style={itemRow}>
                  <Text style={itemText}>
                    {item.quantity}x {item.name} - {formatCurrency(item.price * item.quantity)}
                  </Text>
                </div>
              ))}
            </Section>

            <Section style={statusBox}>
              <Text style={statusText}>
                Status: <strong style={statusPending}>PENDENTE</strong>
              </Text>
              <Text style={statusInfo}>
                Sua comissão será aprovada após a confirmação do pagamento e
                processamento do pedido.
              </Text>
            </Section>

            <Button style={button} href={dashboardLink}>
              Ver no Dashboard
            </Button>

            <Text style={helpText}>
              Acompanhe todas as suas comissões e vendas através do seu
              dashboard personalizado.
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

const commissionBox = {
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
}

const commissionTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '15px',
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const tableLabel = {
  fontSize: '14px',
  color: '#6b7280',
  padding: '8px 0',
  width: '40%',
}

const tableValue = {
  fontSize: '14px',
  color: '#111827',
  padding: '8px 0',
  fontWeight: '500',
}

const tableLabelHighlight = {
  fontSize: '14px',
  color: '#111827',
  padding: '12px 0 8px 0',
  fontWeight: '600',
  borderTop: '1px solid #e5e7eb',
}

const tableValueHighlight = {
  fontSize: '16px',
  color: '#059669',
  padding: '12px 0 8px 0',
  fontWeight: '700',
  borderTop: '1px solid #e5e7eb',
}

const itemsSection = {
  marginBottom: '20px',
}

const itemsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '10px',
}

const itemRow = {
  paddingLeft: '20px',
  marginBottom: '5px',
}

const itemText = {
  fontSize: '14px',
  color: '#4b5563',
}

const statusBox = {
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '8px',
  marginBottom: '30px',
  borderLeft: '4px solid #f59e0b',
}

const statusText = {
  fontSize: '14px',
  color: '#92400e',
  marginBottom: '5px',
}

const statusPending = {
  color: '#d97706',
}

const statusInfo = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
}

const button = {
  backgroundColor: '#111827',
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