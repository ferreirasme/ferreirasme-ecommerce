"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, UserCheck, Phone, Mail } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

interface ConsultantData {
  id: string
  code: string
  full_name: string
  email: string
  phone?: string
  whatsapp?: string
  commission_percentage: number
}

interface ConsultantInfoProps {
  consultantCode: string | null
  onRemove: () => void
}

export function ConsultantInfo({ consultantCode, onRemove }: ConsultantInfoProps) {
  const [consultant, setConsultant] = useState<ConsultantData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (consultantCode) {
      fetchConsultantData(consultantCode)
    }
  }, [consultantCode])

  const fetchConsultantData = async (code: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/consultants/by-code/${code}`)
      if (response.ok) {
        const data = await response.json()
        setConsultant(data)
      } else {
        console.error("Consultora não encontrada")
        // Não mostra erro ao usuário, apenas não exibe o componente
      }
    } catch (error) {
      console.error("Erro ao buscar consultora:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!consultantCode || loading || !consultant) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(consultant.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Consultora: {consultant.full_name}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="font-mono">Código: {consultant.code}</span>
                {consultant.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{consultant.phone}</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-primary font-medium">
                Esta compra será vinculada à consultora
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => {
              onRemove()
              toast.info("Vínculo com consultora removido")
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}