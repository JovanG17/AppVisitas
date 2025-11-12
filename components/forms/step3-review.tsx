"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MapPin, Ruler, AlertTriangle, Camera, User, Save, Send, Loader2 } from "lucide-react"
import type { PQRSRecord } from "@/lib/db"
import { SeverityIndicator } from "@/components/severity-indicator"
import { formatCoordinates } from "@/lib/geolocation"

interface Step3ReviewProps {
  data: Partial<PQRSRecord>
  onComplete: (data: Partial<PQRSRecord>) => void
  onBack: () => void
}

export function Step3Review({ data, onComplete, onBack }: Step3ReviewProps) {
  const [responsable, setResponsable] = useState(data.operacion?.responsable || "")
  const [cuadrilla, setCuadrilla] = useState(data.operacion?.cuadrilla || "")
  const [observaciones, setObservaciones] = useState(data.observaciones || "")
  const [saving, setSaving] = useState(false)

  const handleSaveOffline = async () => {
    if (!responsable.trim()) {
      alert("Por favor, ingrese el nombre del responsable")
      return
    }

    setSaving(true)

    const finalData: Partial<PQRSRecord> = {
      operacion: {
        responsable: responsable.trim(),
        cuadrilla: cuadrilla.trim() || undefined,
        estado: "Registrado",
      },
      observaciones: observaciones.trim() || undefined,
      sync_state: "local_only",
    }

    try {
      await onComplete(finalData)
    } catch (error) {
      console.error("[v0] Error saving:", error)
      setSaving(false)
    }
  }

  const handleSaveAndSync = async () => {
    if (!responsable.trim()) {
      alert("Por favor, ingrese el nombre del responsable")
      return
    }

    setSaving(true)

    const finalData: Partial<PQRSRecord> = {
      operacion: {
        responsable: responsable.trim(),
        cuadrilla: cuadrilla.trim() || undefined,
        estado: "Registrado",
      },
      observaciones: observaciones.trim() || undefined,
      sync_state: "queued",
    }

    try {
      await onComplete(finalData)

      // Agregar a cola de sincronización
      const { db } = await import("@/lib/db")
      const record = { ...data, ...finalData } as PQRSRecord
      await db.addToSyncQueue(record, "create")
    } catch (error) {
      console.error("[v0] Error saving:", error)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Paso 3: Revisión y Envío</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revise los datos ingresados y complete la información operativa
        </p>
      </div>

      {/* Resumen del registro */}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>UBICACIÓN</span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de PQRS</p>
              <p className="font-medium">{data.tipo}</p>
            </div>
            {data.ubicacion && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Coordenadas GPS</p>
                  <p className="font-mono text-sm">{formatCoordinates(data.ubicacion.lat, data.ubicacion.lon)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{data.ubicacion.direccion}</p>
                </div>
                {data.ubicacion.barrio && (
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Barrio</p>
                      <p className="font-medium">{data.ubicacion.barrio}</p>
                    </div>
                    {data.ubicacion.comuna && (
                      <div>
                        <p className="text-sm text-muted-foreground">Comuna</p>
                        <p className="font-medium">{data.ubicacion.comuna}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Ruler className="h-4 w-4" />
            <span>CLASIFICACIÓN Y MEDICIONES</span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de afectación</p>
              <p className="font-medium">{data.clasificacion}</p>
            </div>
            {data.medicion && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Largo</p>
                    <p className="font-medium">{data.medicion.largo_m.toFixed(2)} m</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ancho</p>
                    <p className="font-medium">{data.medicion.ancho_m.toFixed(2)} m</p>
                  </div>
                </div>
                {data.medicion.profundidad_cm && (
                  <div>
                    <p className="text-sm text-muted-foreground">Profundidad</p>
                    <p className="font-medium">{data.medicion.profundidad_cm} cm</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Área afectada</p>
                  <p className="font-semibold text-lg">{data.medicion.area_m2.toFixed(2)} m²</p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>EVALUACIÓN DE RIESGO</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {data.riesgo && (
              <>
                <div>
                  <p className="text-muted-foreground">Exposición peatones</p>
                  <p className="font-medium">{data.riesgo.exposicion_peaton}/3</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exposición vehículos</p>
                  <p className="font-medium">{data.riesgo.exposicion_vehiculo}/3</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Velocidad vía</p>
                  <p className="font-medium">{data.riesgo.velocidad_via}/3</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prox. equipamientos</p>
                  <p className="font-medium">{data.riesgo.prox_equipamientos}/2</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {data.severidad && <SeverityIndicator severity={data.severidad} />}

        {data.evidencias && data.evidencias.fotos.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>EVIDENCIAS FOTOGRÁFICAS</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data.evidencias.fotos.map((photo, index) => (
                <div key={index} className="aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`Evidencia ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{data.evidencias.fotos.length} foto(s) adjunta(s)</p>
          </Card>
        )}
      </div>

      <Separator />

      {/* Información operativa */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <User className="h-4 w-4" />
          <span>INFORMACIÓN OPERATIVA</span>
        </div>

        <div>
          <Label htmlFor="responsable">Responsable del Registro *</Label>
          <Input
            id="responsable"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Nombre completo del técnico"
            className="mt-1.5"
            required
          />
        </div>

        <div>
          <Label htmlFor="cuadrilla">Cuadrilla (opcional)</Label>
          <Input
            id="cuadrilla"
            value={cuadrilla}
            onChange={(e) => setCuadrilla(e.target.value)}
            placeholder="Nombre o código de cuadrilla"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="observaciones">Observaciones Adicionales</Label>
          <Textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ingrese cualquier información adicional relevante..."
            rows={4}
            maxLength={1000}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">{observaciones.length}/1000 caracteres</p>
        </div>
      </div>

      <Separator />

      {/* Botones de acción */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            size="lg"
            disabled={saving}
            className="sm:w-auto bg-transparent"
          >
            Volver
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveOffline}
              disabled={saving}
              size="lg"
              className="sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Guardar offline
                </>
              )}
            </Button>

            <Button type="button" onClick={handleSaveAndSync} disabled={saving} size="lg" className="sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Guardar y sincronizar
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Los registros se guardan localmente y se sincronizan cuando hay conexión
        </p>
      </div>
    </div>
  )
}
