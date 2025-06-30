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
import type { Consultant, Client, Commission } from '@/types/consultant'

interface MonthlyReportProps {
  consultant: Consultant
  reportData: {
    month: string
    year: number
    totalCommissions: number
    totalEarnings: number
    newClients: number
    topClients: Array<Client & { totalSpent: number }>
    commissions: Commission[]
  }
  dashboardLink: string
  unsubscribeLink: string
}

export default function MonthlyReport({
  consultant,
  reportData,
  dashboardLink,
  unsubscribeLink,
}: MonthlyReportProps) {
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
    })
  }

  // Calcular estatísticas
  const approvedCommissions = reportData.commissions.filter(
    (c) => c.status === 'APPROVED' || c.status === 'PAID'
  ).length
  
  const pendingCommissions = reportData.commissions.filter(
    (c) => c.status === 'PENDING'
  ).length

  return (
    <Html>
      <Head />
      <Preview>
        Resumo mensal - {reportData.month}/{String(reportData.year)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Ferreiras ME</Text>
            <Text style={subtitle}>Semijoias Exclusivas</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>
              Olá {consultant.firstName}, aqui está seu resumo mensal!
            </Text>

            <Text style={paragraph}>
              Confira abaixo o resumo das suas atividades em {reportData.month} 
              de {reportData.year}.
            </Text>

            {/* Resumo Principal */}
            <Section style={summaryGrid}>
              <div style={summaryCard}>
                <Text style={summaryLabel}>Total de Comissões</Text>
                <Text style={summaryValue}>{reportData.totalCommissions}</Text>
              </div>
              <div style={summaryCard}>
                <Text style={summaryLabel}>Ganhos do Mês</Text>
                <Text style={summaryValueHighlight}>
                  {formatCurrency(reportData.totalEarnings)}
                </Text>
              </div>
              <div style={summaryCard}>
                <Text style={summaryLabel}>Novas Clientes</Text>
                <Text style={summaryValue}>{reportData.newClients}</Text>
              </div>
            </Section>

            {/* Status das Comissões */}
            <Section style={statusSection}>
              <Text style={sectionTitle}>Status das Comissões</Text>
              <table style={statusTable}>
                <tr>
                  <td style={statusLabel}>Aprovadas/Pagas:</td>
                  <td style={statusValueGreen}>{approvedCommissions}</td>
                </tr>
                <tr>
                  <td style={statusLabel}>Pendentes:</td>
                  <td style={statusValueYellow}>{pendingCommissions}</td>
                </tr>
              </table>
            </Section>

            {/* Top Clientes */}
            {reportData.topClients.length > 0 && (
              <Section style={topClientsSection}>
                <Text style={sectionTitle}>Top 3 Clientes do Mês</Text>
                {reportData.topClients.slice(0, 3).map((client, index) => (
                  <div key={index} style={clientRow}>
                    <Text style={clientName}>
                      {index + 1}. {client.firstName} {client.lastName}
                    </Text>
                    <Text style={clientAmount}>
                      {formatCurrency(client.totalSpent)}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {/* Últimas Comissões */}
            {reportData.commissions.length > 0 && (
              <Section style={commissionsSection}>
                <Text style={sectionTitle}>Últimas Comissões</Text>
                <table style={commissionsTable}>
                  <thead>
                    <tr>
                      <th style={tableHeader}>Data</th>
                      <th style={tableHeader}>Pedido</th>
                      <th style={tableHeader}>Cliente</th>
                      <th style={tableHeader}>Valor</th>
                      <th style={tableHeader}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.commissions.slice(0, 5).map((commission, index) => (
                      <tr key={index}>
                        <td style={tableCell}>
                          {formatDate(commission.orderDate)}
                        </td>
                        <td style={tableCell}>
                          #{commission.orderDetails.orderNumber}
                        </td>
                        <td style={tableCell}>
                          {commission.orderDetails.customerName.split(' ')[0]}
                        </td>
                        <td style={tableCell}>
                          {formatCurrency(commission.commissionAmount)}
                        </td>
                        <td style={tableCell}>
                          <span style={getStatusStyle(commission.status)}>
                            {getStatusText(commission.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            <Button style={button} href={dashboardLink}>
              Ver Relatório Completo
            </Button>

            <Text style={motivationalText}>
              Continue o excelente trabalho! 💪 Estamos aqui para apoiar seu 
              crescimento.
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
            <Link href={unsubscribeLink} style={button}>
              Gerenciar preferências de email
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Helper functions
function getStatusStyle(status: string) {
  switch (status) {
    case 'PAID':
      return { color: '#059669', fontWeight: '600' }
    case 'APPROVED':
      return { color: '#10b981', fontWeight: '600' }
    case 'PENDING':
      return { color: '#f59e0b', fontWeight: '600' }
    default:
      return { color: '#6b7280', fontWeight: '600' }
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'PAID':
      return 'Pago'
    case 'APPROVED':
      return 'Aprovado'
    case 'PENDING':
      return 'Pendente'
    default:
      return status
  }
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
  marginBottom: '30px',
}

const summaryGrid = {
  display: 'flex',
  gap: '15px',
  marginBottom: '30px',
  flexWrap: 'wrap' as const,
}

const summaryCard = {
  flex: '1',
  minWidth: '150px',
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center' as const,
}

const summaryLabel = {
  fontSize: '13px',
  color: '#6b7280',
  marginBottom: '5px',
}

const summaryValue = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#111827',
  margin: '0',
}

const summaryValueHighlight = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#059669',
  margin: '0',
}

const statusSection = {
  backgroundColor: '#fafafa',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
}

const sectionTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '15px',
}

const statusTable = {
  width: '100%',
}

const statusLabel = {
  fontSize: '14px',
  color: '#6b7280',
  padding: '5px 0',
}

const statusValueGreen = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#059669',
  padding: '5px 0',
}

const statusValueYellow = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#f59e0b',
  padding: '5px 0',
}

const topClientsSection = {
  marginBottom: '20px',
}

const clientRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  marginBottom: '8px',
}

const clientName = {
  fontSize: '14px',
  color: '#111827',
  margin: '0',
}

const clientAmount = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#059669',
  margin: '0',
}

const commissionsSection = {
  marginBottom: '30px',
}

const commissionsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '13px',
}

const tableHeader = {
  textAlign: 'left' as const,
  padding: '8px',
  borderBottom: '2px solid #e5e7eb',
  color: '#6b7280',
  fontWeight: '600',
}

const tableCell = {
  padding: '8px',
  borderBottom: '1px solid #f3f4f6',
  color: '#111827',
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

const motivationalText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  fontStyle: 'italic',
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