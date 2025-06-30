'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { OTPInput } from '@/components/ui/otp-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Shield, Loader2 } from 'lucide-react'

interface TwoFactorDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

export function TwoFactorDialog({ open, onClose, onSuccess, userId }: TwoFactorDialogProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // Verify 2FA code
      const { data, error: verifyError } = await supabase.rpc('verify_2fa_code', {
        user_id: userId,
        code: code
      })

      if (verifyError || !data) {
        setError('Código inválido ou expirado')
        return
      }

      // Log successful 2FA verification
      await supabase.from('access_logs').insert({
        user_id: userId,
        action: '2fa_verified',
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      })

      toast.success('Autenticação de 2 fatores concluída')
      onSuccess()
    } catch (error) {
      setError('Erro ao verificar código')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // Generate and send new 2FA code
      const { error } = await supabase.rpc('send_2fa_code', {
        user_id: userId
      })

      if (error) {
        toast.error('Erro ao enviar novo código')
      } else {
        toast.success('Novo código enviado para seu email')
        setCode('')
        setError('')
      }
    } catch (error) {
      toast.error('Erro ao enviar código')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Autenticação de 2 Fatores</DialogTitle>
          </div>
          <DialogDescription>
            Digite o código de 6 dígitos enviado para seu email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <OTPInput
              value={code}
              onChange={setCode}
              length={6}
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={loading}
            >
              Reenviar código
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}