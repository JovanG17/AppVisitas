"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import type { PQRSRecord } from "@/lib/db"
import { calculateSeverity, calculateArea, validateMedicion } from "@/lib/severity-calculator"
import { SeverityIndicator } from "@/components/severity-indicator"
import { PhotoCapture } from "@/components/photo-capture"

interface Step2ClassificationProps {
  initialData: Partial<PQRSRecord>
  onNext: (data: Partial<PQRSRecord>) => void
  onBack: () => void
}

export function Step2Classification({ initialData, onNext, onBack }: Step2ClassificationProps) {
  const [clasificacion, setClasificacion] = useState<PQRSRecord["clasificacion"]>(
    initialData.clasificacion || "Calzada",
  )
  const [largoM, setLargoM] = useState(initialData.medicion?.largo_m?.toString() || "")
  const [anchoM, setAnchoM] = useState(initialData.medicion?.ancho_m?.toString() || "")
  const [profundidadCm, setProfundidadCm] = useState(initialData.medicion?.profundidad_cm?.toString() || "")
  const [areaM2, setAreaM2] = useState(initialData.medicion?.area_m2 || 0)

  const [exposicionPeaton, setExposicionPeaton] = useState<0 | 1 | 2 | 3>(initialData.riesgo?.exposicion_peaton || 0)
  const [exposicionVehiculo, setExposicionVehiculo] = useState<0 | 1 | 2 | 3>(
    initialData.riesgo?.exposicion_vehiculo || 0,
  )
  const [velocidadVia, setVelocidadVia] = useState<0 | 1 | 2 | 3>(initialData.riesgo?.velocidad_via || 0)
  const [proxEquipamientos, setProxEquipamientos] = useState<0 | 1 | 2>(initialData.riesgo?.prox_equipamientos || 0)

  const [fotos, setFotos] = useState<string[]>(initialData.evidencias?.fotos || [])
  const [errors, setErrors] = useState<string[]>([])

  const [severity, setSeverity] = useState(initialData.severidad)

  // Recalcular área y severidad cuando cambien las medidas o riesgo
  useEffect(() => {
    const largo = Number.parseFloat(largoM)
    const ancho = Number.parseFloat(anchoM)

    if (!isNaN(largo) && !isNaN(ancho) && largo > 0 && ancho > 0) {
      const area = calculateArea(largo, ancho)
      setAreaM2(area)

      const profundidad = Number.parseFloat(profundidadCm) || 0

      const severityResult = calculateSeverity(
        {
          largo_m: largo,
          ancho_m: ancho,
          profundidad_cm: profundidad,
          area_m2: area,
        },
        {
          exposicion_peaton: exposicionPeaton,
          exposicion_vehiculo: exposicionVehiculo,
          velocidad_via: velocidadVia,
          prox_equipamientos: proxEquipamientos,
        },
        {
          antiguedad_dias: 0,
          reincidencia: 0,
          via_critica: 0,
        },
      )

      setSeverity({
        score: severityResult.score,
        nivel: severityResult.nivel,
        sla_estimado_h: severityResult.sla_estimado_h,
      })
    }
  }, [largoM, anchoM, profundidadCm, exposicionPeaton, exposicionVehiculo, velocidadVia, proxEquipamientos])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const largo = Number.parseFloat(largoM)
    const ancho = Number.parseFloat(anchoM)
    const profundidad = Number.parseFloat(profundidadCm) || undefined

    // Validar mediciones
    const validationErrors = validateMedicion({
      largo_m: largo,
      ancho_m: ancho,
      profundidad_cm: profundidad,
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    // Validar fotos según severidad
    if (severity && severity.score >= 40 && fotos.length === 0) {
      setErrors(["Se requiere al menos 1 foto para severidad Media o Alta"])
      return
    }

    setErrors([])

    onNext({
      clasificacion,
      medicion: {
        largo_m: largo,
        ancho_m: ancho,
        profundidad_cm: profundidad,
        area_m2: areaM2,
      },
      riesgo: {
        exposicion_peaton: exposicionPeaton,
        exposicion_vehiculo: exposicionVehiculo,
        velocidad_via: velocidadVia,
        prox_equipamientos: proxEquipamientos,
      },
      severidad: severity!,
      evidencias: {
        fotos,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Paso 2: Clasificación y Mediciones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Clasifique la afectación, tome medidas y capture evidencias
        </p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">Errores de validación:</p>
              <ul className="mt-1 list-inside list-disc text-sm text-destructive">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="clasificacion">Tipo de Afectación *</Label>
          <Select
            value={clasificacion}
            onValueChange={(value) => setClasificacion(value as PQRSRecord["clasificacion"])}
          >
            <SelectTrigger id="clasificacion" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Calzada">Calzada (baches, grietas)</SelectItem>
              <SelectItem value="Andén">Andén (hundimientos, daños)</SelectItem>
              <SelectItem value="Señalización">Señalización (faltante, dañada)</SelectItem>
              <SelectItem value="Drenaje">Drenaje (alcantarillas, sumideros)</SelectItem>
              <SelectItem value="Espacio público">Espacio público (parques, plazas)</SelectItem>
              <SelectItem value="Alumbrado">Alumbrado (postes, luminarias)</SelectItem>
              <SelectItem value="Vegetación">Vegetación (árboles, podas)</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-semibold">Mediciones *</Label>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="largo">Largo (metros)</Label>
              <Input
                id="largo"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={largoM}
                onChange={(e) => setLargoM(e.target.value)}
                placeholder="0.00"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="ancho">Ancho (metros)</Label>
              <Input
                id="ancho"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={anchoM}
                onChange={(e) => setAnchoM(e.target.value)}
                placeholder="0.00"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="profundidad">Profundidad (cm)</Label>
              <Input
                id="profundidad"
                type="number"
                step="1"
                min="0"
                max="100"
                value={profundidadCm}
                onChange={(e) => setProfundidadCm(e.target.value)}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
          </div>

          {areaM2 > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Área calculada: <span className="font-semibold">{areaM2.toFixed(2)} m²</span>
            </p>
          )}
        </div>

        <div>
          <Label className="text-base font-semibold">Exposición a Riesgo</Label>
          <div className="mt-3 space-y-4">
            <div>
              <Label htmlFor="exp-peaton">Exposición a Peatones</Label>
              <Select
                value={exposicionPeaton.toString()}
                onValueChange={(value) => setExposicionPeaton(Number.parseInt(value) as 0 | 1 | 2 | 3)}
              >
                <SelectTrigger id="exp-peaton" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Ninguna</SelectItem>
                  <SelectItem value="1">1 - Baja</SelectItem>
                  <SelectItem value="2">2 - Media</SelectItem>
                  <SelectItem value="3">3 - Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="exp-vehiculo">Exposición a Vehículos</Label>
              <Select
                value={exposicionVehiculo.toString()}
                onValueChange={(value) => setExposicionVehiculo(Number.parseInt(value) as 0 | 1 | 2 | 3)}
              >
                <SelectTrigger id="exp-vehiculo" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Ninguna</SelectItem>
                  <SelectItem value="1">1 - Baja</SelectItem>
                  <SelectItem value="2">2 - Media</SelectItem>
                  <SelectItem value="3">3 - Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="velocidad-via">Velocidad de la Vía</Label>
              <Select
                value={velocidadVia.toString()}
                onValueChange={(value) => setVelocidadVia(Number.parseInt(value) as 0 | 1 | 2 | 3)}
              >
                <SelectTrigger id="velocidad-via" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Muy baja (&lt;30 km/h)</SelectItem>
                  <SelectItem value="1">1 - Baja (30-50 km/h)</SelectItem>
                  <SelectItem value="2">2 - Media (50-80 km/h)</SelectItem>
                  <SelectItem value="3">3 - Alta (&gt;80 km/h)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prox-equip">Proximidad a Equipamientos</Label>
              <Select
                value={proxEquipamientos.toString()}
                onValueChange={(value) => setProxEquipamientos(Number.parseInt(value) as 0 | 1 | 2)}
              >
                <SelectTrigger id="prox-equip" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Ninguna</SelectItem>
                  <SelectItem value="1">1 - Cercana (escuelas, hospitales)</SelectItem>
                  <SelectItem value="2">2 - Muy cercana (entrada directa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {severity && <SeverityIndicator severity={severity} />}

        <div>
          <Label className="text-base font-semibold">
            Evidencias Fotográficas {severity && severity.score >= 40 ? "*" : ""}
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {severity && severity.score >= 40
              ? "Obligatorio: mínimo 1 foto para severidad Media o Alta"
              : "Opcional: puede agregar entre 1 y 5 fotos"}
          </p>
          <div className="mt-3">
            <PhotoCapture photos={fotos} onChange={setFotos} maxPhotos={5} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} size="lg" className="sm:w-auto bg-transparent">
          Volver
        </Button>
        <Button type="submit" size="lg" className="sm:w-auto">
          Continuar a revisión
        </Button>
      </div>
    </form>
  )
}
