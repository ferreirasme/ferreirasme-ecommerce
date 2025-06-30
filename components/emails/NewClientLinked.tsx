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
import type { Consultant, Client } from '@/types/consultant'

interface NewClientLinkedProps {
  consultant: Consultant
  client: Client
  dashboardLink: string
  unsubscribeLink: string
}

export default function NewClientLinked({
  consultant,
  client,
  dashboardLink,
  unsubscribeLink,
}: NewClientLinkedProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Html>
      <Head />
      <Preview>Nova cliente vinculada à sua conta</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Ferreiras ME</Text>
            <Text style={subtitle}>Semijoias Exclusivas</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>
              Olá {consultant.firstName}, você tem uma nova cliente!
            </Text>

            <Text style={paragraph}>
              Uma nova cliente foi vinculada à sua conta de consultora. 
              Agora você receberá comissões sobre todas as compras realizadas por ela.
            </Text>

            <Section style={clientBox}>
              <Text style={clientTitle}>Dados da Nova Cliente</Text>
              
              <table style={table}>
                <tr>
                  <td style={tableLabel}>Nome:</td>
                  <td style={tableValue}>
                    {client.firstName} {client.lastName}
                  </td>
                </tr>
                <tr>
                  <td style={tableLabel}>Email:</td>
                  <td style={tableValue}>{client.email}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Telefone:</td>
                  <td style={tableValue}>{client.phone}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Data de Cadastro:</td>
                  <td style={tableValue}>{formatDate(client.registrationDate)}</td>
                </tr>
                {client.address && (
                  <tr>
                    <td style={tableLabel}>Localização:</td>
                    <td style={tableValue}>
                      {client.address.city}, {client.address.state}
                    </td>
                  </tr>
                )}
              </table>
            </Section>

            <Section style={tipsBox}>
              <Text style={tipsTitle}>Dicas para Engajar sua Nova Cliente:</Text>
              <ul style={tipsList}>
                <li style={tipsItem}>
                  Entre em contacto para dar as boas-vindas e apresentar as novidades
                </li>
                <li style={tipsItem}>
                  Compartilhe promoções exclusivas e lançamentos
                </li>
                <li style={tipsItem}>
                  Ofereça um atendimento personalizado baseado nas preferências dela
                </li>
                <li style={tipsItem}>
                  Mantenha um relacionamento próximo para fidelizar a cliente
                </li>
              </ul>
            </Section>

            <Button style={button} href={dashboardLink}>
              Ver Cliente no Dashboard
            </Button>

            <Text style={infoText}>
              <strong>Lembre-se:</strong> Você receberá {consultant.commissionRate}% 
              de comissão sobre todas as compras desta cliente.
            </Text>

            <Text style={motivationalText}>
              Continue assim! Quanto mais clientes você cadastrar, maiores serão 
              seus ganhos mensais. 🚀
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

const clientBox = {
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
}

const clientTitle = {
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
  width: '35%',
}

const tableValue = {
  fontSize: '14px',
  color: '#111827',
  padding: '8px 0',
  fontWeight: '500',
}

const tipsBox = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '30px',
}

const tipsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#92400e',
  marginBottom: '10px',
}

const tipsList = {
  paddingLeft: '20px',
  margin: '0',
}

const tipsItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#92400e',
  marginBottom: '8px',
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

const infoText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4b5563',
  marginBottom: '15px',
  backgroundColor: '#eff6ff',
  padding: '10px 15px',
  borderRadius: '6px',
  borderLeft: '4px solid #3b82f6',
}

const motivationalText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#059669',
  fontWeight: '500',
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