import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Heart, Shield, Leaf } from "lucide-react"

export default function AboutPage() {
  const values = [
    {
      icon: Sparkles,
      title: "Qualidade Premium",
      description: "Utilizamos apenas materiais de alta qualidade com banho de ouro 18k"
    },
    {
      icon: Heart,
      title: "Feito com Amor",
      description: "Cada peça é cuidadosamente selecionada e preparada com carinho"
    },
    {
      icon: Shield,
      title: "Garantia Total",
      description: "Oferecemos garantia em todas as nossas peças contra defeitos"
    },
    {
      icon: Leaf,
      title: "Sustentável",
      description: "Comprometidos com práticas sustentáveis e responsáveis"
    }
  ]

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Sobre a Ferreira's Me</h1>
        
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-muted-foreground text-center text-lg mb-8">
            Uma história de paixão por semijoias que começou em 2020
          </p>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h2 className="text-2xl font-semibold mb-4">A Nossa História</h2>
              <p className="text-muted-foreground mb-4">
                A Ferreira's Me nasceu do sonho de criar semijoias que combinam elegância, 
                qualidade e preços acessíveis. Começámos como uma pequena loja familiar em 
                Lisboa e hoje orgulhamo-nos de servir clientes em todo o Portugal.
              </p>
              <p className="text-muted-foreground">
                Cada peça da nossa coleção é cuidadosamente selecionada para garantir que 
                oferecemos apenas o melhor aos nossos clientes. Trabalhamos com fornecedores 
                de confiança que partilham os nossos valores de qualidade e excelência.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                [Imagem da loja]
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-center mb-8">Os Nossos Valores</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">A Nossa Missão</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tornar a elegância acessível a todas as mulheres, oferecendo semijoias de 
              qualidade superior que realçam a beleza única de cada cliente. Acreditamos 
              que toda mulher merece brilhar e sentir-se especial.
            </p>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Porquê Escolher-nos?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-muted-foreground">
                  Semijoias com banho de ouro 18k de alta durabilidade
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-muted-foreground">
                  Garantia de qualidade em todos os produtos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-muted-foreground">
                  Envio grátis para compras acima de 50€
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-muted-foreground">
                  Atendimento personalizado e dedicado
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-muted-foreground">
                  Política de trocas e devoluções flexível
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}