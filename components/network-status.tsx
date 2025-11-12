"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    // Check pending sync items
    const checkPending = async () => {
      try {
        const { db } = await import("@/lib/db")
        await db.init()
        const queue = await db.getSyncQueue()
        setPendingCount(queue.length)
      } catch (error) {
        console.error("[v0] Error checking sync queue:", error)
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {pendingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
        </Badge>
      )}
      {isOnline ? (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">En línea</span>
        </Badge>
      ) : (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          <span className="hidden sm:inline">Sin conexión</span>
        </Badge>
      )}
    </div>
  )
}
