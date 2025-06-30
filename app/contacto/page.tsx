"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a integração com o backend
    toast.success("Mensagem enviada com sucesso! Entraremos em contacto em breve.")
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefone",
      content: "(+351) 999 999 999",
      subContent: "Segunda a Sexta, 9h às 18h"
    },
    {
      icon: Mail,
      title: "Email",
      content: "contacto@ferreirasme.com",
      subContent: "Respondemos em até 24h"
    },
    {
      icon: MapPin,
      title: "Morada",
      content: "Rua do Comércio, 123",
      subContent: "1000-000 Lisboa, Portugal"
    },
    {
      icon: Clock,
      title: "Horário",
      content: "Segunda a Sexta: 9h - 18h",
      subContent: "Sábado: 10h - 14h"
    }
  ]

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Contacte-nos</h1>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Estamos aqui para ajudar! Entre em contacto connosco para esclarecer dúvidas, 
          fazer encomendas especiais ou dar sugestões.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Envie-nos uma Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Informações de Contacto</h2>
              <div className="grid gap-4">
                {contactInfo.map((info) => (
                  <Card key={info.title}>
                    <CardContent className="flex items-start gap-4 pt-6">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{info.title}</h3>
                        <p className="text-sm">{info.content}</p>
                        <p className="text-xs text-muted-foreground">{info.subContent}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Perguntas Frequentes</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Como posso acompanhar o meu pedido?</p>
                    <p className="text-muted-foreground">
                      Após a compra, receberá um email com o código de rastreamento.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Qual o prazo de entrega?</p>
                    <p className="text-muted-foreground">
                      Entre 2 a 5 dias úteis para Portugal Continental.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Posso devolver um produto?</p>
                    <p className="text-muted-foreground">
                      Sim, aceitamos devoluções até 30 dias após a compra.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 bg-muted rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Prefere falar connosco?</h3>
          <p className="text-muted-foreground mb-4">
            Ligue-nos durante o horário de atendimento e teremos todo o gosto em ajudar.
          </p>
          <Button size="lg" asChild>
            <a href="tel:+351999999999">
              <Phone className="mr-2 h-4 w-4" />
              Ligar Agora
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}