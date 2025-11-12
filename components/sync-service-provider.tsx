"use client"

import type React from "react"

import { useEffect } from "react"

export function SyncServiceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar servicio de sincronización cuando la app carga
    const initSync = async () => {
      try {
        const { syncService } = await import("@/lib/sync-service")
        syncService.start()

        console.log("[v0] Sync service initialized")
      } catch (error) {
        console.error("[v0] Error initializing sync service:", error)
      }
    }

    initSync()

    // Cleanup al desmontar
    return () => {
      import("@/lib/sync-service").then(({ syncService }) => {
        syncService.stop()
      })
    }
  }, [])

  return <>{children}</>
}
