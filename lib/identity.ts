export function normalizeDocument(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 9 ? `51${digits}` : digits
}
