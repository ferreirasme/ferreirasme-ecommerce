// Enums
export enum ConsultantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum ConsentType {
  MARKETING = 'MARKETING',
  DATA_PROCESSING = 'DATA_PROCESSING',
  COMMUNICATIONS = 'COMMUNICATIONS',
  NEWSLETTER = 'NEWSLETTER'
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING'
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// Interfaces
export interface Consultant {
  id: string
  code: string // Código único da consultora
  status: ConsultantStatus
  
  // Dados pessoais
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  nif: string // Número de Identificação Fiscal
  
  // Dados bancários
  iban: string
  bankName?: string
  
  // Endereço
  address: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  // Dados profissionais
  joinDate: string
  commissionRate: number // Percentual de comissão
  
  // Relacionamentos
  clientIds: string[]
  
  // Metadados
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  consultantId: string
  status: ClientStatus
  
  // Dados pessoais
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Endereço (opcional)
  address?: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  // Dados de relacionamento
  registrationDate: string
  lastPurchaseDate?: string
  totalPurchases: number
  totalSpent: number
  
  // Metadados
  createdAt: string
  updatedAt: string
}

export interface Commission {
  id: string
  consultantId: string
  orderId: string
  clientId: string
  status: CommissionStatus
  
  // Valores
  orderAmount: number
  commissionRate: number
  commissionAmount: number
  
  // Datas
  orderDate: string
  approvalDate?: string
  paymentDate?: string
  
  // Detalhes do pedido
  orderDetails: {
    orderNumber: string
    customerName: string
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
  }
  
  // Metadados
  createdAt: string
  updatedAt: string
}

export interface ConsentRecord {
  id: string
  consultantId: string
  type: ConsentType
  status: ConsentStatus
  
  // Detalhes do consentimento
  grantedAt?: string
  revokedAt?: string
  expiresAt?: string
  
  // Informações adicionais
  ipAddress: string
  userAgent: string
  consentText: string
  version: string
  
  // Metadados
  createdAt: string
  updatedAt: string
}

// DTOs para formulários
export interface ConsultantFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  nif: string
  iban: string
  bankName?: string
  address: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  commissionRate: number
}

export interface ClientFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

// Tipos auxiliares
export interface CommissionFilter {
  consultantId?: string
  clientId?: string
  status?: CommissionStatus
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
}

export interface ConsultantDashboard {
  totalClients: number
  activeClients: number
  totalCommissions: number
  pendingCommissions: number
  totalEarnings: number
  monthlyEarnings: number
  recentOrders: Commission[]
  topClients: Array<Client & { totalSpent: number }>
}

export interface ConsentUpdateData {
  consultantId: string
  type: ConsentType
  status: ConsentStatus
  ipAddress: string
  userAgent: string
}