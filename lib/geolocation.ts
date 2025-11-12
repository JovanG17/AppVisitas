// Geolocation utilities for GPS capture
export interface GeolocationResult {
  lat: number
  lon: number
  accuracy: number
  timestamp: number
}

export interface GeolocationError {
  code: number
  message: string
}

/**
 * Obtiene la ubicación actual del dispositivo
 */
export async function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: "Geolocalización no disponible en este navegador",
      })
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      },
      (error) => {
        let message = "Error desconocido"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permiso de ubicación denegado. Por favor, habilite el GPS en configuración."
            break
          case error.POSITION_UNAVAILABLE:
            message = "Información de ubicación no disponible."
            break
          case error.TIMEOUT:
            message = "Tiempo de espera agotado al obtener ubicación."
            break
        }

        reject({
          code: error.code,
          message,
        })
      },
      options,
    )
  })
}

/**
 * Formatea coordenadas para mostrar
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S"
  const lonDir = lon >= 0 ? "E" : "O"

  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`
}

/**
 * Genera enlace a Google Maps
 */
export function getGoogleMapsLink(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`
}
