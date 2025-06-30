"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface MBWayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (phoneNumber: string) => void
  loading?: boolean
}

export function MBWayDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  loading = false 
}: MBWayDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState("")

  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, "")
    
    // Limita a 9 dígitos
    const limited = numbers.slice(0, 9)
    
    // Formata como 9XX XXX XXX
    if (limited.length > 6) {
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`
    } else if (limited.length > 3) {
      return `${limited.slice(0, 3)} ${limited.slice(3)}`
    }
    
    return limited
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Remove espaços para validação
    const cleanNumber = phoneNumber.replace(/\s/g, "")
    
    // Valida o número
    if (!cleanNumber) {
      setError("Por favor, insira o número de telemóvel")
      return
    }
    
    if (cleanNumber.length !== 9) {
      setError("O número deve ter 9 dígitos")
      return
    }
    
    if (!cleanNumber.startsWith("9")) {
      setError("O número deve começar com 9")
      return
    }
    
    // Adiciona o código do país
    const fullNumber = `+351${cleanNumber}`
    onConfirm(fullNumber)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento MB Way</DialogTitle>
          <DialogDescription>
            Insira o número de telemóvel associado ao MB Way
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de Telemóvel</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted rounded-md">
                <span className="text-sm font-medium">+351</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="912 345 678"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="flex-1"
                autoFocus
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A processar...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}