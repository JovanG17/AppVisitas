// Severity Index Calculator for PQRS
import type { PQRSRecord } from "./db"

export interface SeverityComponents {
  tamano: number
  riesgo: number
  contexto: number
}

export interface SeverityResult {
  score: number
  nivel: "Baja" | "Media" | "Alta"
  components: SeverityComponents
  sla_estimado_h: number
}

/**
 * Calcula el Índice de Severidad (IS) según la fórmula:
 * IS = 0.4*T + 0.4*R + 0.2*C
 *
 * Tamaño (T): área y profundidad
 * Riesgo (R): exposición a peatones, vehículos, velocidad vial, proximidad a equipamientos
 * Contexto (C): antigüedad, reincidencia, vía crítica
 */
export function calculateSeverity(
  medicion: PQRSRecord["medicion"],
  riesgo: PQRSRecord["riesgo"],
  contexto?: PQRSRecord["contexto"],
): SeverityResult {
  // Componente Tamaño (T) - 40%
  const area_m2 = medicion.area_m2
  const profundidad_cm = medicion.profundidad_cm || 0

  // Normaliza área (hasta 10m²) y profundidad (hasta 100cm)
  const tamanoArea = Math.min(100, (area_m2 / 10) * 60)
  const tamanoProfundidad = Math.min(100, (profundidad_cm / 100) * 40)
  const tamano = Math.min(100, tamanoArea + tamanoProfundidad)

  // Componente Riesgo (R) - 40%
  const riesgoTotal =
    riesgo.exposicion_peaton * 15 +
    riesgo.exposicion_vehiculo * 15 +
    riesgo.velocidad_via * 15 +
    riesgo.prox_equipamientos * 10
  const riesgoScore = Math.min(100, riesgoTotal)

  // Componente Contexto (C) - 20%
  let contextoScore = 0
  if (contexto) {
    const antiguedad = Math.min(100, contexto.antiguedad_dias * 5)
    const reincidencia = contexto.reincidencia * 15
    const viaCritica = contexto.via_critica * 10
    contextoScore = Math.min(100, antiguedad + reincidencia + viaCritica)
  }

  // Índice de Severidad Final
  const score = Math.round(0.4 * tamano + 0.4 * riesgoScore + 0.2 * contextoScore)

  // Determinar nivel
  let nivel: "Baja" | "Media" | "Alta"
  let sla_estimado_h: number

  if (score >= 70) {
    nivel = "Alta"
    sla_estimado_h = 24 // 1 día
  } else if (score >= 40) {
    nivel = "Media"
    sla_estimado_h = 72 // 3 días
  } else {
    nivel = "Baja"
    sla_estimado_h = 168 // 7 días
  }

  return {
    score,
    nivel,
    components: {
      tamano: Math.round(tamano),
      riesgo: Math.round(riesgoScore),
      contexto: Math.round(contextoScore),
    },
    sla_estimado_h,
  }
}

/**
 * Valida que las mediciones estén en rangos aceptables
 */
export function validateMedicion(medicion: Partial<PQRSRecord["medicion"]>): string[] {
  const errors: string[] = []

  if (!medicion.largo_m || medicion.largo_m <= 0) {
    errors.push("El largo debe ser mayor a 0 metros")
  } else if (medicion.largo_m > 100) {
    errors.push("El largo no puede exceder 100 metros")
  }

  if (!medicion.ancho_m || medicion.ancho_m <= 0) {
    errors.push("El ancho debe ser mayor a 0 metros")
  } else if (medicion.ancho_m > 100) {
    errors.push("El ancho no puede exceder 100 metros")
  }

  if (medicion.profundidad_cm !== undefined && medicion.profundidad_cm < 0) {
    errors.push("La profundidad no puede ser negativa")
  } else if (medicion.profundidad_cm && medicion.profundidad_cm > 100) {
    errors.push("La profundidad no puede exceder 100 cm")
  }

  return errors
}

/**
 * Calcula el área automáticamente
 */
export function calculateArea(largo_m: number, ancho_m: number): number {
  return Math.round(largo_m * ancho_m * 100) / 100 // Redondeo a 2 decimales
}
