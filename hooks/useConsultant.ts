import { useState, useEffect, useCallback } from 'react'
import { Consultant, ConsultantFormData, ConsultantDashboard } from '@/types/consultant'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/use-toast'

interface UseConsultantReturn {
  consultant: Consultant | null
  dashboard: ConsultantDashboard | null
  isLoading: boolean
  error: Error | null
  createConsultant: (data: ConsultantFormData) => Promise<Consultant>
  updateConsultant: (id: string, data: Partial<ConsultantFormData>) => Promise<Consultant>
  fetchConsultant: (id: string) => Promise<void>
  fetchDashboard: (id: string) => Promise<void>
  generateConsultantCode: () => string
}

export function useConsultant(): UseConsultantReturn {
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [dashboard, setDashboard] = useState<ConsultantDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()
  const { toast } = useToast()

  // Generate unique consultant code
  const generateConsultantCode = useCallback(() => {
    const prefix = 'CON'
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }, [])

  // Fetch consultant data
  const fetchConsultant = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      const response = await fetch(`/api/consultants/${id}`, {
        headers: {
          // 'Authorization': `Bearer ${user?.token}`, // Token removed from UserProfile
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch consultant')
      }
      
      const data = await response.json()
      setConsultant(data)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da consultora',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      const response = await fetch(`/api/consultants/${id}/dashboard`, {
        headers: {
          // 'Authorization': `Bearer ${user?.token}`, // Token removed from UserProfile
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard')
      }
      
      const data = await response.json()
      setDashboard(data)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o dashboard',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Create consultant
  const createConsultant = useCallback(async (data: ConsultantFormData): Promise<Consultant> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const consultantData = {
        ...data,
        code: generateConsultantCode(),
        status: 'PENDING',
        joinDate: new Date().toISOString(),
        clientIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Simulate API call
      const response = await fetch('/api/consultants', {
        method: 'POST',
        headers: {
          // 'Authorization': `Bearer ${user?.token}`, // Token removed from UserProfile
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultantData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create consultant')
      }
      
      const newConsultant = await response.json()
      setConsultant(newConsultant)
      
      toast({
        title: 'Sucesso',
        description: 'Consultora criada com sucesso!'
      })
      
      return newConsultant
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a consultora',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user, generateConsultantCode, toast])

  // Update consultant
  const updateConsultant = useCallback(async (id: string, data: Partial<ConsultantFormData>): Promise<Consultant> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      }
      
      // Simulate API call
      const response = await fetch(`/api/consultants/${id}`, {
        method: 'PATCH',
        headers: {
          // 'Authorization': `Bearer ${user?.token}`, // Token removed from UserProfile
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update consultant')
      }
      
      const updatedConsultant = await response.json()
      setConsultant(updatedConsultant)
      
      toast({
        title: 'Sucesso',
        description: 'Consultora atualizada com sucesso!'
      })
      
      return updatedConsultant
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a consultora',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Mock data for development
  useEffect(() => {
    // This is temporary mock data for development
    if (process.env.NODE_ENV === 'development' && !consultant) {
      const mockConsultant: Consultant = {
        id: '1',
        code: 'CON-123ABC-XYZ',
        status: 'ACTIVE' as any,
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria.silva@example.com',
        phone: '912345678',
        birthDate: '1990-01-01',
        nif: '123456789',
        iban: 'PT50000000000000000000000',
        bankName: 'Banco Exemplo',
        address: {
          street: 'Rua das Flores',
          number: '123',
          city: 'Lisboa',
          state: 'Lisboa',
          postalCode: '1234-567',
          country: 'Portugal'
        },
        joinDate: '2024-01-01',
        commissionRate: 10,
        clientIds: ['client1', 'client2'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
      
      const mockDashboard: ConsultantDashboard = {
        totalClients: 15,
        activeClients: 12,
        totalCommissions: 25,
        pendingCommissions: 5,
        totalEarnings: 2500,
        monthlyEarnings: 450,
        recentOrders: [],
        topClients: []
      }
      
      // Set mock data after a delay to simulate loading
      setTimeout(() => {
        setConsultant(mockConsultant)
        setDashboard(mockDashboard)
      }, 1000)
    }
  }, [consultant])

  return {
    consultant,
    dashboard,
    isLoading,
    error,
    createConsultant,
    updateConsultant,
    fetchConsultant,
    fetchDashboard,
    generateConsultantCode
  }
}