import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Clock, Shield, HelpCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ReturnsPage() {
  const policies = [
    {
      icon: Clock,
      title: "30 Dias para Devolver",
      description: "Tem até 30 dias após a receção do pedido para solicitar a devolução ou troca."
    },
    {
      icon: Package,
      title: "Produto em Perfeitas Condições",
      description: "O produto deve estar nas mesmas condições em que foi recebido, com etiquetas e embalagem original."
    },
    {
      icon: Shield,
      title: "Reembolso Garantido",
      description: "Após a receção e verificação do produto, o reembolso é processado em até 5 dias úteis."
    }
  ]

  const steps = [
    {
      number: "1",
      title: "Solicite a Devolução",
      description: "Entre em contacto connosco através do email ou telefone informando o motivo da devolução."
    },
    {
      number: "2",
      title: "Prepare o Produto",
      description: "Embale o produto nas condições originais, incluindo todos os acessórios e etiquetas."
    },
    {
      number: "3",
      title: "Envie o Produto",
      description: "Envie o produto para a nossa morada com o código de devolução que forneceremos."
    },
    {
      number: "4",
      title: "Receba o Reembolso",
      description: "Após verificação, processamos o reembolso ou enviamos o produto de troca."
    }
  ]

  const faqs = [
    {
      question: "Quais produtos podem ser devolvidos?",
      answer: "Todos os produtos podem ser devolvidos, exceto brincos por questões de higiene, a menos que apresentem defeito de fabrico."
    },
    {
      question: "Quem paga os custos de envio da devolução?",
      answer: "Em caso de defeito ou erro nosso, assumimos os custos. Para outras situações, os custos são da responsabilidade do cliente."
    },
    {
      question: "Posso trocar por outro produto?",
      answer: "Sim, pode trocar por qualquer outro produto disponível no nosso catálogo. Diferenças de valor serão acertadas."
    },
    {
      question: "E se o produto chegou com defeito?",
      answer: "Entre em contacto imediatamente. Produtos com defeito são trocados ou reembolsados integralmente, incluindo custos de envio."
    }
  ]

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Trocas e Devoluções</h1>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          A sua satisfação é a nossa prioridade. Conheça a nossa política de trocas e devoluções 
          e compre com total confiança.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {policies.map((policy) => (
            <Card key={policy.title}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <policy.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{policy.title}</h3>
                  <p className="text-sm text-muted-foreground">{policy.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Como Funciona</h2>
          <div className="grid gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="mt-4 ml-5 border-l-2 border-dashed border-muted h-6" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="pb-6 border-b last:border-0 last:pb-0">
                  <h4 className="font-medium mb-2">{faq.question}</h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Precisa de Ajuda?</h3>
          <p className="text-muted-foreground mb-6">
            A nossa equipa está disponível para esclarecer todas as suas dúvidas sobre trocas e devoluções.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/contacto">
                Falar Connosco
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:contacto@ferreirasme.com">
                Enviar Email
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <h3 className="font-semibold">Condições Importantes:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Os produtos devem estar sem uso, com todas as etiquetas e embalagens originais.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Brincos não podem ser devolvidos por questões de higiene, exceto em caso de defeito.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>O prazo de 30 dias conta a partir da data de receção do pedido.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Produtos personalizados ou feitos por encomenda não são elegíveis para devolução.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Reservamo-nos o direito de recusar devoluções que não cumpram estas condições.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}