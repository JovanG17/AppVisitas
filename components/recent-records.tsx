"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, AlertTriangle } from "lucide-react"
import type { PQRSRecord } from "@/lib/db"
import Link from "next/link"

export function RecentRecords() {
  const [records, setRecords] = useState<PQRSRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const { db } = await import("@/lib/db")
      await db.init()
      const allRecords = await db.getAllPQRS()
      // Sort by timestamp descending, take first 5
      const sorted = allRecords
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
      setRecords(sorted)
    } catch (error) {
      console.error("[v0] Error loading records:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Cargando...</div>
  }

  if (records.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No hay registros recientes</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Link key={record.id} href={`/detalle/${record.id}`}>
          <Card className="cursor-pointer p-4 transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{record.radicado}</h3>
                  <SeverityBadge nivel={record.severidad.nivel} />
                  <SyncStateBadge state={record.sync_state} />
                </div>

                <p className="mt-1 text-sm text-muted-foreground">{record.clasificacion}</p>

                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{record.ubicacion.barrio || "Sin barrio"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(record.timestamp).toLocaleDateString("es-CO")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>IS: {record.severidad.score}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function SeverityBadge({ nivel }: { nivel: "Baja" | "Media" | "Alta" }) {
  const variants = {
    Baja: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    Media: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    Alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  return (
    <Badge variant="secondary" className={variants[nivel]}>
      {nivel}
    </Badge>
  )
}

function SyncStateBadge({ state }: { state: PQRSRecord["sync_state"] }) {
  const labels = {
    local_only: "Local",
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

  return (
    <Badge variant={variants[state]} className="text-xs">
      {labels[state]}
    </Badge>
  )
}
