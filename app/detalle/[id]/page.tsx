"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, MapPin, Ruler, Camera, User, ExternalLink, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import type { PQRSRecord } from "@/lib/db"
import { SeverityIndicator } from "@/components/severity-indicator"
import { formatCoordinates, getGoogleMapsLink } from "@/lib/geolocation"

export default function DetallePage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<PQRSRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadRecord()
  }, [params.id])

  const loadRecord = async () => {
    try {
      const { db } = await import("@/lib/db")
      await db.init()
      const data = await db.getPQRS(params.id as string)
      setRecord(data)
    } catch (error) {
      console.error("[v0] Error loading record:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!record) return

    setSyncing(true)
    try {
      const { syncService } = await import("@/lib/sync-service")
      await syncService.syncRecord(record)
      await loadRecord()
    } catch (error) {
      console.error("[v0] Error syncing:", error)
      alert("Error al sincronizar. Por favor, intente nuevamente.")
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!record) return

    const confirmed = confirm("¿Está seguro de eliminar este registro? Esta acción no se puede deshacer.")

    if (confirmed) {
      try {
        const { db } = await import("@/lib/db")
        await db.deletePQRS(record.id!)
        router.push("/")
      } catch (error) {
        console.error("[v0] Error deleting:", error)
        alert("Error al eliminar el registro.")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Registro no encontrado</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{record.radicado}</h1>
                <p className="text-sm text-muted-foreground">{record.clasificacion}</p>
              </div>
            </div>
            <SyncStateBadge state={record.sync_state} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="space-y-4">
          <SeverityIndicator severity={record.severidad} />

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>UBICACIÓN</span>
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de PQRS</p>
                <p className="font-medium">{record.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coordenadas GPS</p>
                <p className="font-mono text-sm">{formatCoordinates(record.ubicacion.lat, record.ubicacion.lon)}</p>
                <a
                  href={getGoogleMapsLink(record.ubicacion.lat, record.ubicacion.lon)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center text-xs text-primary hover:underline"
                >
                  Ver en Google Maps
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">{record.ubicacion.direccion}</p>
              </div>
              {(record.ubicacion.barrio || record.ubicacion.comuna) && (
                <div className="flex gap-4">
                  {record.ubicacion.barrio && (
                    <div>
                      <p className="text-sm text-muted-foreground">Barrio</p>
                      <p className="font-medium">{record.ubicacion.barrio}</p>
                    </div>
                  )}
                  {record.ubicacion.comuna && (
                    <div>
                      <p className="text-sm text-muted-foreground">Comuna</p>
                      <p className="font-medium">{record.ubicacion.comuna}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Ruler className="h-4 w-4" />
              <span>MEDICIONES</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Largo</p>
                <p className="font-medium">{record.medicion.largo_m.toFixed(2)} m</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ancho</p>
                <p className="font-medium">{record.medicion.ancho_m.toFixed(2)} m</p>
              </div>
              {record.medicion.profundidad_cm && (
                <div>
                  <p className="text-muted-foreground">Profundidad</p>
                  <p className="font-medium">{record.medicion.profundidad_cm} cm</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Área afectada</p>
                <p className="font-semibold text-lg">{record.medicion.area_m2.toFixed(2)} m²</p>
              </div>
            </div>
          </Card>

          {record.evidencias.fotos.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Camera className="h-4 w-4" />
                <span>EVIDENCIAS</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {record.evidencias.fotos.map((photo, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Evidencia ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <User className="h-4 w-4" />
              <span>INFORMACIÓN OPERATIVA</span>
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Responsable</p>
                <p className="font-medium">{record.operacion.responsable}</p>
              </div>
              {record.operacion.cuadrilla && (
                <div>
                  <p className="text-sm text-muted-foreground">Cuadrilla</p>
                  <p className="font-medium">{record.operacion.cuadrilla}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="secondary">{record.operacion.estado}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de registro</p>
                <p className="font-medium">{new Date(record.timestamp).toLocaleString("es-CO")}</p>
              </div>
            </div>
          </Card>

          {record.observaciones && (
            <Card className="p-4">
              <p className="text-sm font-semibold text-muted-foreground">OBSERVACIONES</p>
              <p className="mt-2 text-sm">{record.observaciones}</p>
            </Card>
          )}

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row">
            {record.sync_state !== "synced" && (
              <Button onClick={handleSync} disabled={syncing || !navigator.onLine} size="lg" className="flex-1">
                {syncing ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Sincronizar ahora
                  </>
                )}
              </Button>
            )}

            <Button variant="destructive" onClick={handleDelete} size="lg" className="flex-1 sm:flex-none">
              <Trash2 className="mr-2 h-5 w-5" />
              Eliminar
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

function SyncStateBadge({ state }: { state: PQRSRecord["sync_state"] }) {
  const labels = {
    local_only: "Solo local",
    queued: "En cola",
    synced: "Sincronizado",
    error: "Error",
  }

  const variants = {
    local_only: "secondary",
    queued: "secondary",
    synced: "default",
    error: "destructive",
  } as const

  return <Badge variant={variants[state]}>{labels[state]}</Badge>
}
