// Valid columns for each table based on actual database schema
export const tableSchemas = {
  products: {
    columns: [
      'id',
      'name',
      'slug',
      'description',
      'price',
      'sale_price',
      'sku',
      'stock_quantity',
      'category_id',
      'featured',
      'active',
      'metadata',
      'created_at',
      'updated_at',
      'odoo_id'
    ],
    required: ['name', 'slug', 'price'],
    unique: ['slug', 'sku', 'odoo_id']
  },
  consultants: {
    columns: [
      'id',
      'user_id',
      'code',
      'full_name',
      'email',
      'phone',
      'whatsapp',
      'nif',
      'birth_date',
      'address_street',
      'address_number',
      'address_complement',
      'address_neighborhood',
      'address_city',
      'address_state',
      'address_postal_code',
      'address_country',
      'bank_name',
      'bank_iban',
      'bank_account_holder',
      'commission_percentage',
      'monthly_target',
      'commission_period_days',
      'notes',
      'status',
      'consent_date',
      'consent_version',
      'created_by',
      'created_at',
      'updated_at',
      'odoo_id',
      'odoo_partner_id',
      'function',
      'mobile',
      'website',
      'street2',
      'state_id',
      'country_code',
      'parent_id',
      'supplier_rank',
      'customer_rank',
      'partner_share',
      'profile_image',
      'profile_image_url',
      'odoo_image'
    ],
    required: ['user_id', 'code', 'full_name', 'email', 'phone'],
    unique: ['user_id', 'code', 'email', 'odoo_id']
  }
}

/**
 * Validates and filters object to only include valid columns for a table
 */
export function filterValidColumns(tableName: keyof typeof tableSchemas, data: Record<string, any>): Record<string, any> {
  const schema = tableSchemas[tableName]
  if (!schema) {
    throw new Error(`No schema found for table: ${tableName}`)
  }

  const filtered: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (schema.columns.includes(key)) {
      filtered[key] = value
    }
  }
  
  return filtered
}

/**
 * Validates required fields are present
 */
export function validateRequiredFields(tableName: keyof typeof tableSchemas, data: Record<string, any>): { valid: boolean; missing: string[] } {
  const schema = tableSchemas[tableName]
  if (!schema) {
    throw new Error(`No schema found for table: ${tableName}`)
  }

  const missing: string[] = []
  
  for (const field of schema.required) {
    if (!data[field]) {
      missing.push(field)
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  }
}