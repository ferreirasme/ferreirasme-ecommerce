"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/store/auth"
import { createClient } from "@/lib/supabase/client"
import { Package, Heart, MapPin, Settings, LogOut } from "lucide-react"
import Link from "next/link"

export default function AccountPage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/login")
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (!user) {
    return null
  }

  const menuItems = [
    {
      icon: Package,
      title: "Meus Pedidos",
      description: "Acompanhe seus pedidos",
      href: "/conta/pedidos",
    },
    {
      icon: Heart,
      title: "Favoritos",
      description: "Produtos salvos",
      href: "/conta/favoritos",
    },
    {
      icon: MapPin,
      title: "Endereços",
      description: "Gerenciar endereços de entrega",
      href: "/conta/enderecos",
    },
    {
      icon: Settings,
      title: "Configurações",
      description: "Dados pessoais e preferências",
      href: "/conta/configuracoes",
    },
  ]

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Separator className="my-8" />

        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}