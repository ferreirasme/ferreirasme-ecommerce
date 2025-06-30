// Phone number formatter for Portuguese numbers
export function formatPhone(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Format as XXX XXX XXX
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`
  }
}

// NIF (Portuguese tax number) formatter
export function formatNIF(value: string): string {
  // Remove all non-numeric characters
  return value.replace(/\D/g, '').slice(0, 9)
}

// IBAN formatter
export function formatIBAN(value: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  
  // Format as XXXX XXXX XXXX XXXX XXXX XXXX X
  const parts = []
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.slice(i, i + 4))
  }
  
  return parts.join(' ').trim()
}

// Portuguese postal code formatter (XXXX-XXX)
export function formatPostalCode(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 4) {
    return numbers
  } else {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}`
  }
}

// Validate Portuguese phone number
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 9 && (cleaned.startsWith('9') || cleaned.startsWith('2'))
}

// Validate NIF
export function validateNIF(nif: string): boolean {
  const cleaned = nif.replace(/\D/g, '')
  if (cleaned.length !== 9) return false
  
  // Basic NIF validation algorithm
  const checkDigit = parseInt(cleaned[8])
  let sum = 0
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleaned[i]) * (9 - i)
  }
  
  const remainder = sum % 11
  const calculatedDigit = remainder < 2 ? 0 : 11 - remainder
  
  return checkDigit === calculatedDigit
}

// Validate IBAN
export function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  
  // Portuguese IBAN should be 25 characters
  if (!cleaned.startsWith('PT') || cleaned.length !== 25) {
    return false
  }
  
  // Move first 4 characters to end and convert letters to numbers
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, (match) => {
    return (match.charCodeAt(0) - 'A'.charCodeAt(0) + 10).toString()
  })
  
  // Perform mod 97 calculation
  let remainder = ''
  for (let i = 0; i < numeric.length; i++) {
    remainder = (parseInt(remainder + numeric[i]) % 97).toString()
  }
  
  return remainder === '1'
}

// Validate Portuguese postal code
export function validatePostalCode(postalCode: string): boolean {
  return /^\d{4}-\d{3}$/.test(postalCode)
}