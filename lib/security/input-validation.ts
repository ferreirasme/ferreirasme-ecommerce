import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Email inválido');

export const phoneSchema = z.string().regex(
  /^(\+351)?[239]\d{8}$/,
  'Número de telefone inválido'
);

export const postalCodeSchema = z.string().regex(
  /^\d{4}-\d{3}$/,
  'Código postal deve estar no formato XXXX-XXX'
);

export const otpSchema = z.string().regex(
  /^[A-Z0-9]{8}$/,
  'Código OTP inválido'
);

// Address validation
export const addressSchema = z.object({
  street: z.string().min(3, 'Rua deve ter pelo menos 3 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  postal_code: postalCodeSchema,
});

// Product validation
export const productIdSchema = z.string().uuid('ID de produto inválido');

export const cartItemSchema = z.object({
  product_id: productIdSchema,
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
});

// Payment validation
export const paymentMethodSchema = z.enum(['credit_card', 'debit_card', 'mbway', 'multibanco']);

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// Validate and sanitize pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Search validation
export const searchQuerySchema = z.string()
  .min(2, 'Pesquisa deve ter pelo menos 2 caracteres')
  .max(100, 'Pesquisa muito longa')
  .transform(sanitizeInput);