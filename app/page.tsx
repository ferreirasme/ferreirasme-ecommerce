import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Shield, Truck } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function HomePage() {
  const categories = [
    { name: "Anéis", slug: "aneis", image: "/images/aneis.jpg" },
    { name: "Colares", slug: "colares", image: "/images/colares.jpg" },
    { name: "Brincos", slug: "brincos", image: "/images/brincos.jpg" },
    { name: "Pulseiras", slug: "pulseiras", image: "/images/pulseiras.jpg" },
  ]

  const featuredProducts = [
    {
      id: "1",
      slug: "anel-solitario-zirconia",
      name: "Anel Solitário Zircônia",
      price: 89.90,
      salePrice: 69.90,
      image: "/images/produto1.jpg",
    },
    {
      id: "2",
      slug: "colar-ponto-de-luz",
      name: "Colar Ponto de Luz",
      price: 129.90,
      image: "/images/produto2.jpg",
    },
    {
      id: "3",
      slug: "brinco-argola-cravejada",
      name: "Brinco Argola Cravejada",
      price: 79.90,
      image: "/images/produto3.jpg",
    },
    {
      id: "4",
      slug: "pulseira-veneziana",
      name: "Pulseira Veneziana",
      price: 149.90,
      salePrice: 119.90,
      image: "/images/produto4.jpg",
    },
  ]

  const benefits = [
    {
      icon: Sparkles,
      title: "Qualidade Premium",
      description: "Semijoias com banho de ouro 18k e garantia",
    },
    {
      icon: Truck,
      title: "Envio Grátis",
      description: "Em compras acima de 50€",
    },
    {
      icon: Shield,
      title: "Compra Segura",
      description: "Os seus dados protegidos com encriptação",
    },
  ]

  return (
    <>
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background to-background/50 z-10" />
        <Image
          src="/images/placeholder.svg"
          alt="Banner principal"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 text-center max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Semijoias que Encantam
          </h1>
          <p className="text-lg md:text-xl mb-8 text-muted-foreground">
            Descubra a nossa coleção exclusiva de semijoias com design único e acabamento impecável
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/produtos">
                Ver Coleção
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/produtos?categoria=novidades">Novidades</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Categorias</h2>
          <p className="text-muted-foreground">
            Encontre a joia perfeita para cada momento
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/produtos?categoria=${category.slug}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-center">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
            <p className="text-muted-foreground">
              Peças selecionadas especialmente para si
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/produtos/${product.slug}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted">
                    {product.salePrice && (
                      <Badge className="absolute top-2 left-2 z-10" variant="destructive">
                        Promoção
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      {product.salePrice ? (
                        <>
                          <span className="text-lg font-bold">
                            {formatCurrency(product.salePrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild>
              <Link href="/produtos">
                Ver Todos os Produtos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}