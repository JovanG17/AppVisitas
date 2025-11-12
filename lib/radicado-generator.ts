// Radicado generator for PQRS
/**
 * Genera un radicado único para el registro PQRS
 * Formato: PQRS-YYYYMMDD-XXXXX
 * Ejemplo: PQRS-20250112-00001
 */
export function generateRadicado(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  // Generar número secuencial (en producción debería venir del backend)
  const sequence = String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0")

  return `PQRS-${year}${month}${day}-${sequence}`
}

/**
 * Valida formato de radicado
 */
export function validateRadicado(radicado: string): boolean {
  const pattern = /^PQRS-\d{8}-\d{5}$/
  return pattern.test(radicado)
}
