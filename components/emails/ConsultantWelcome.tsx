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
  Img,
} from '@react-email/components'
import type { Consultant } from '@/types/consultant'

interface ConsultantWelcomeProps {
  consultant: Consultant
  temporaryPassword?: string
  unsubscribeLink: string
}

export default function ConsultantWelcome({
  consultant,
  temporaryPassword,
  unsubscribeLink,
}: ConsultantWelcomeProps) {
  return (
    <Html>
      <Head />
      <Preview>Bem-vinda à equipe Ferreiras ME!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Ferreiras ME</Text>
            <Text style={subtitle}>Semijoias Exclusivas</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>
              Olá {consultant.firstName}, bem-vinda à nossa equipe!
            </Text>

            <Text style={paragraph}>
              É com grande prazer que lhe damos as boas-vindas como consultora
              Ferreiras ME. Estamos muito felizes por tê-la connosco!
            </Text>

            <Section style={infoBox}>
              <Text style={infoTitle}>Seus dados de acesso:</Text>
              <Text style={infoText}>
                <strong>Código de Consultora:</strong> {consultant.code}
              </Text>
              <Text style={infoText}>
                <strong>Email:</strong> {consultant.email}
              </Text>
              {temporaryPassword && (
                <Text style={infoText}>
                  <strong>Senha temporária:</strong> {temporaryPassword}
                </Text>
              )}
            </Section>

            <Text style={paragraph}>
              Como nossa consultora, você terá acesso a:
            </Text>

            <ul style={list}>
              <li style={listItem}>Dashboard personalizado com suas vendas</li>
              <li style={listItem}>Gestão de clientes vinculadas</li>
              <li style={listItem}>Acompanhamento de comissões em tempo real</li>
              <li style={listItem}>Relatórios mensais detalhados</li>
              <li style={listItem}>Suporte dedicado para consultoras</li>
            </ul>

            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL}/consultant/dashboard`}
            >
              Acessar Dashboard
            </Button>

            <Text style={paragraph}>
              <strong>Próximos passos:</strong>
            </Text>
            <ol style={list}>
              <li style={listItem}>Faça login com suas credenciais</li>
              {temporaryPassword && (
                <li style={listItem}>Altere sua senha temporária</li>
              )}
              <li style={listItem}>Complete seu perfil</li>
              <li style={listItem}>Comece a cadastrar suas clientes</li>
            </ol>

            <Text style={paragraph}>
              Se tiver qualquer dúvida, não hesite em nos contactar. Estamos
              aqui para apoiá-la em sua jornada de sucesso!
            </Text>

            <Text style={signature}>
              Atenciosamente,
              <br />
              Equipe Ferreiras ME
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Ferreiras ME. Todos os direitos
              reservados.
            </Text>
            <Text style={footerText}>
              Este email foi enviado para {consultant.email} porque você se
              cadastrou como consultora Ferreiras ME.
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

const infoBox = {
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
}

const infoTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '10px',
}

const infoText = {
  fontSize: '14px',
  color: '#4b5563',
  marginBottom: '5px',
}

const list = {
  paddingLeft: '20px',
  marginBottom: '20px',
}

const listItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
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
  marginTop: '10px',
  marginBottom: '30px',
}

const signature = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  marginTop: '30px',
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