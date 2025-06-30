"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Lock, Mail, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Tentar fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        console.error("Erro de login:", error)
        toast.error("Credenciais inválidas")
        setIsLoading(false)
        return
      }

      if (!data.user) {
        toast.error("Usuário não encontrado")
        setIsLoading(false)
        return
      }

      // Verificar se é um admin
      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", data.user.id)
        .eq("active", true)
        .maybeSingle()

      if (adminError) {
        console.error("Erro ao verificar admin:", adminError)
        await supabase.auth.signOut()
        toast.error("Erro ao verificar permissões")
        setIsLoading(false)
        return
      }

      if (!admin) {
        await supabase.auth.signOut()
        toast.error("Acesso negado. Você não tem permissões de administrador.")
        setIsLoading(false)
        return
      }

      toast.success("Login realizado com sucesso!")
      
      // Usar window.location para garantir navegação completa
      window.location.href = "/admin/dashboard"
    } catch (error) {
      console.error("Erro no login:", error)
      toast.error("Erro ao fazer login")
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5" />
      
      <Card className="w-full max-w-md relative">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Área Administrativa
          </CardTitle>
          <CardDescription className="text-center">
            Acesso restrito a administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="admin@ferreirasme.com"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="••••••••"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Área restrita para administradores do sistema.</p>
            <p className="mt-1">Em caso de problemas, contate o suporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}