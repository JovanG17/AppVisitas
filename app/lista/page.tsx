"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, MapPin, Calendar, AlertTriangle, Search } from "lucide-react"
import type { PQRSRecord } from "@/lib/db"

export default function ListaPage() {
  const [records, setRecords] = useState<PQRSRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<PQRSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterNivel, setFilterNivel] = useState<string>("all")
  const [filterSync, setFilterSync] = useState<string>("all")

  useEffect(() => {
    loadRecords()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterNivel, filterSync, records])

  const loadRecords = async () => {
    try {
      const { db } = await import("@/lib/db")
      await db.init()
      const allRecords = await db.getAllPQRS()
      const sorted = allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecords(sorted)
      setFilteredRecords(sorted)
    } catch (error) {
      console.error("[v0] Error loading records:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...records]

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.radicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.ubicacion.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.clasificacion.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por nivel de severidad
    if (filterNivel !== "all") {
      filtered = filtered.filter((r) => r.severidad.nivel === filterNivel)
    }

    // Filtro por estado de sincronización
    if (filterSync !== "all") {
      filtered = filtered.filter((r) => r.sync_state === filterSync)
    }

    setFilteredRecords(filtered)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando registros...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Registros PQRS</h1>
              <p className="text-sm text-muted-foreground">
                {filteredRecords.length} de {records.length} registros
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por radicado, dirección o clasificación..."
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las severidades</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSync} onValueChange={setFilterSync}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por sincronización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="local_only">Solo local</SelectItem>
                <SelectItem value="queued">En cola</SelectItem>
                <SelectItem value="synced">Sincronizado</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {records.length === 0
                ? "No hay registros guardados"
                : "No se encontraron registros con los filtros seleccionados"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
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
                          <span>{record.ubicacion.barrio || record.ubicacion.direccion}</span>
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
        )}
      </main>
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
    queued: "Cola",
    synced: "Sync",
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
