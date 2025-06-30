"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function DebugOTPPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [otpData, setOtpData] = useState<any>(null)

  const checkOTP = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/debug/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      setOtpData(data)
      
      if (data.otp_codes && data.otp_codes.length > 0) {
        toast.success(`Encontrados ${data.otp_codes.length} códigos OTP`)
      } else {
        toast.info("Nenhum código OTP encontrado para este email")
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Debug OTP - Verificar Códigos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          
          <Button 
            onClick={checkOTP}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Verificando...' : 'Verificar Códigos OTP'}
          </Button>
          
          {otpData && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Resultados:</h3>
              
              {otpData.otp_codes && otpData.otp_codes.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Códigos OTP encontrados: {otpData.otp_codes.length}
                  </p>
                  {otpData.otp_codes.map((otp: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Código:</span> {otp.code}
                        </div>
                        <div>
                          <span className="font-medium">Usado:</span> {otp.used ? '✅ Sim' : '❌ Não'}
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span> {new Date(otp.created_at).toLocaleString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Expira em:</span> {new Date(otp.expires_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Status:</span> {' '}
                        {new Date(otp.expires_at) < new Date() ? '🔴 Expirado' : '🟢 Válido'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum código OTP encontrado para este email.</p>
              )}
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Informações do Sistema:</h4>
                <div className="text-sm space-y-1">
                  <p>Hora atual do servidor: {otpData.server_time}</p>
                  <p>Timezone: {otpData.timezone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}