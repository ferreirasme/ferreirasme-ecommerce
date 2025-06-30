import { useState, useCallback } from 'react'
import { ConsentType, ConsentStatus, ConsentRecord, ConsentUpdateData } from '@/types/consultant'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/use-toast'

interface UseConsentReturn {
  consents: ConsentRecord[]
  isLoading: boolean
  error: Error | null
  fetchConsents: (consultantId: string) => Promise<void>
  updateConsent: (data: ConsentUpdateData) => Promise<ConsentRecord>
  revokeAllConsents: (consultantId: string) => Promise<void>
  getConsentStatus: (type: ConsentType) => ConsentStatus | null
  hasActiveConsent: (type: ConsentType) => boolean
}

export function useConsent(): UseConsentReturn {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()
  const { toast } = useToast()

  // Fetch all consents for a consultant
  const fetchConsents = useCallback(async (consultantId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      const response = await fetch(`/api/consultants/${consultantId}/consents`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch consents')
      }
      
      const data = await response.json()
      setConsents(data)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os consentimentos',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.token, toast])

  // Update a specific consent
  const updateConsent = useCallback(async (data: ConsentUpdateData): Promise<ConsentRecord> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const consentData = {
        ...data,
        consentText: getConsentText(data.type),
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(data.status === ConsentStatus.GRANTED 
          ? { grantedAt: new Date().toISOString() }
          : { revokedAt: new Date().toISOString() }
        )
      }
      
      // Simulate API call
      const response = await fetch(`/api/consultants/${data.consultantId}/consents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consentData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update consent')
      }
      
      const newConsent = await response.json()
      
      // Update local state
      setConsents(prev => {
        const existing = prev.findIndex(c => 
          c.consultantId === data.consultantId && c.type === data.type
        )
        
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = newConsent
          return updated
        }
        
        return [...prev, newConsent]
      })
      
      toast({
        title: 'Sucesso',
        description: data.status === ConsentStatus.GRANTED 
          ? 'Consentimento concedido com sucesso'
          : 'Consentimento revogado com sucesso'
      })
      
      return newConsent
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o consentimento',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user?.token, toast])

  // Revoke all consents
  const revokeAllConsents = useCallback(async (consultantId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get user info for IP and user agent
      const userInfo = {
        ipAddress: '0.0.0.0', // This would come from the server in a real app
        userAgent: navigator.userAgent
      }
      
      // Update all active consents to revoked
      const promises = Object.values(ConsentType).map(type => {
        const activeConsent = consents.find(c => 
          c.type === type && c.status === ConsentStatus.GRANTED
        )
        
        if (activeConsent) {
          return updateConsent({
            consultantId,
            type,
            status: ConsentStatus.REVOKED,
            ...userInfo
          })
        }
        
        return Promise.resolve(null)
      })
      
      await Promise.all(promises)
      
      toast({
        title: 'Sucesso',
        description: 'Todos os consentimentos foram revogados'
      })
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível revogar os consentimentos',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [consents, updateConsent, toast])

  // Get current consent status for a type
  const getConsentStatus = useCallback((type: ConsentType): ConsentStatus | null => {
    const consent = consents
      .filter(c => c.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    
    return consent?.status || null
  }, [consents])

  // Check if consultant has active consent for a type
  const hasActiveConsent = useCallback((type: ConsentType): boolean => {
    return getConsentStatus(type) === ConsentStatus.GRANTED
  }, [getConsentStatus])

  // Get consent text based on type
  const getConsentText = (type: ConsentType): string => {
    const texts = {
      [ConsentType.MARKETING]: `
        Autorizo o envio de comunicações promocionais, ofertas especiais e novidades 
        sobre produtos e serviços da Ferreiras.me por email, SMS e outros meios digitais.
      `,
      [ConsentType.DATA_PROCESSING]: `
        Autorizo o processamento dos meus dados pessoais para fins de análise, 
        personalização de ofertas e melhoria dos serviços prestados, de acordo 
        com a Política de Privacidade.
      `,
      [ConsentType.COMMUNICATIONS]: `
        Autorizo o recebimento de comunicações importantes relacionadas à minha 
        conta, pedidos e alterações nos termos de serviço.
      `,
      [ConsentType.NEWSLETTER]: `
        Desejo receber a newsletter mensal da Ferreiras.me com dicas de moda, 
        tendências e conteúdo exclusivo para consultoras.
      `
    }
    
    return texts[type].trim()
  }

  // Mock data for development
  if (process.env.NODE_ENV === 'development' && consents.length === 0) {
    const mockConsents: ConsentRecord[] = [
      {
        id: '1',
        consultantId: '1',
        type: ConsentType.MARKETING,
        status: ConsentStatus.GRANTED,
        grantedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        consentText: getConsentText(ConsentType.MARKETING),
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        consultantId: '1',
        type: ConsentType.DATA_PROCESSING,
        status: ConsentStatus.GRANTED,
        grantedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        consentText: getConsentText(ConsentType.DATA_PROCESSING),
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        consultantId: '1',
        type: ConsentType.COMMUNICATIONS,
        status: ConsentStatus.GRANTED,
        grantedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        consentText: getConsentText(ConsentType.COMMUNICATIONS),
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    // Set mock data after component mounts
    setTimeout(() => {
      setConsents(mockConsents)
    }, 100)
  }

  return {
    consents,
    isLoading,
    error,
    fetchConsents,
    updateConsent,
    revokeAllConsents,
    getConsentStatus,
    hasActiveConsent
  }
}