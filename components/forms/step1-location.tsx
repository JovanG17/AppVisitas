"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2, ExternalLink } from "lucide-react"
import type { PQRSRecord } from "@/lib/db"
import { getCurrentLocation, formatCoordinates, getGoogleMapsLink } from "@/lib/geolocation"

interface Step1LocationProps {
  initialData: Partial<PQRSRecord>
  onNext: (data: Partial<PQRSRecord>) => void
}

export function Step1Location({ initialData, onNext }: Step1LocationProps) {
  const [tipo, setTipo] = useState<PQRSRecord["tipo"]>(initialData.tipo || "Queja")
  const [location, setLocation] = useState(initialData.ubicacion)
  const [direccion, setDireccion] = useState(initialData.ubicacion?.direccion || "")
  const [barrio, setBarrio] = useState(initialData.ubicacion?.barrio || "")
  const [comuna, setComuna] = useState(initialData.ubicacion?.comuna || "")
  const [loadingGPS, setLoadingGPS] = useState(false)
  const [gpsError, setGpsError] = useState("")

  const handleGetLocation = async () => {
    setLoadingGPS(true)
    setGpsError("")

    try {
      const result = await getCurrentLocation()
      setLocation({
        lat: result.lat,
        lon: result.lon,
      })
    } catch (error: any) {
      setGpsError(error.message)
    } finally {
      setLoadingGPS(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!location) {
      setGpsError("Debe capturar la ubicación GPS")
      return
    }

    if (!direccion.trim()) {
      setGpsError("Debe ingresar una dirección")
      return
    }

    onNext({
      tipo,
      ubicacion: {
        lat: location.lat,
        lon: location.lon,
        direccion: direccion.trim(),
        barrio: barrio.trim() || undefined,
        comuna: comuna || undefined,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Paso 1: Radicado y Ubicación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture la ubicación GPS y registre la dirección del incidente
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tipo">Tipo de PQRS *</Label>
          <Select value={tipo} onValueChange={(value) => setTipo(value as PQRSRecord["tipo"])}>
            <SelectTrigger id="tipo" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Petición">Petición</SelectItem>
              <SelectItem value="Queja">Queja</SelectItem>
              <SelectItem value="Reclamo">Reclamo</SelectItem>
              <SelectItem value="Sugerencia">Sugerencia</SelectItem>
              <SelectItem value="Denuncia">Denuncia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Ubicación GPS *</Label>
          <div className="mt-1.5 space-y-2">
            <Button type="button" onClick={handleGetLocation} disabled={loadingGPS} className="w-full" size="lg">
              {loadingGPS ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-5 w-5" />
                  {location ? "Actualizar ubicación GPS" : "Capturar ubicación GPS"}
                </>
              )}
            </Button>

            {location && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">Coordenadas capturadas:</p>
                <p className="mt-1 font-mono text-sm">{formatCoordinates(location.lat, location.lon)}</p>
                <a
                  href={getGoogleMapsLink(location.lat, location.lon)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                >
                  Ver en Google Maps
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            )}

            {gpsError && <p className="text-sm text-destructive">{gpsError}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="direccion">Dirección *</Label>
          <Input
            id="direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Calle 10 # 20-30"
            className="mt-1.5"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="barrio">Barrio</Label>
            <Input
              id="barrio"
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
              placeholder="Nombre del barrio"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="comuna">Comuna</Label>
            <Select value={comuna} onValueChange={setComuna}>
              <SelectTrigger id="comuna" className="mt-1.5">
                <SelectValue placeholder="Seleccionar comuna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Comuna 1 - Popular</SelectItem>
                <SelectItem value="2">Comuna 2 - Santa Cruz</SelectItem>
                <SelectItem value="3">Comuna 3 - Manrique</SelectItem>
                <SelectItem value="4">Comuna 4 - Aranjuez</SelectItem>
                <SelectItem value="5">Comuna 5 - Castilla</SelectItem>
                <SelectItem value="6">Comuna 6 - Doce de Octubre</SelectItem>
                <SelectItem value="7">Comuna 7 - Robledo</SelectItem>
                <SelectItem value="8">Comuna 8 - Villa Hermosa</SelectItem>
                <SelectItem value="9">Comuna 9 - Buenos Aires</SelectItem>
                <SelectItem value="10">Comuna 10 - La Candelaria</SelectItem>
                <SelectItem value="11">Comuna 11 - Laureles-Estadio</SelectItem>
                <SelectItem value="12">Comuna 12 - La América</SelectItem>
                <SelectItem value="13">Comuna 13 - San Javier</SelectItem>
                <SelectItem value="14">Comuna 14 - El Poblado</SelectItem>
                <SelectItem value="15">Comuna 15 - Guayabal</SelectItem>
                <SelectItem value="16">Comuna 16 - Belén</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Continuar al siguiente paso
        </Button>
      </div>
    </form>
  )
}
