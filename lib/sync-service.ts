// Sync service for Microsoft integration (SharePoint/Power Automate)
import { db, type PQRSRecord, type SyncQueueItem } from "./db"

const SYNC_INTERVAL = 30000 // 30 seconds
const MAX_RETRY_ATTEMPTS = 5

class SyncService {
  private intervalId: NodeJS.Timeout | null = null
  private isSyncing = false

  /**
   * Inicia el servicio de sincronización automática
   */
  start() {
    if (this.intervalId) return

    console.log("[v0] Sync service started")
    this.intervalId = setInterval(() => {
      this.syncPending()
    }, SYNC_INTERVAL)

    // Ejecuta inmediatamente al iniciar
    this.syncPending()
  }

  /**
   * Detiene el servicio de sincronización
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log("[v0] Sync service stopped")
    }
  }

  /**
   * Sincroniza todos los registros pendientes
   */
  async syncPending(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log("[v0] Sync already in progress, skipping")
      return { success: 0, failed: 0 }
    }

    if (!navigator.onLine) {
      console.log("[v0] No connection, skipping sync")
      return { success: 0, failed: 0 }
    }

    this.isSyncing = true
    let success = 0
    let failed = 0

    try {
      const queue = await db.getSyncQueue()
      console.log(`[v0] Found ${queue.length} items in sync queue`)

      for (const item of queue) {
        try {
          if (!item.record_id) {
            throw new Error("record_id is missing from sync queue item")
          }

          await this.syncItem(item)
          success++

          const record = await db.getPQRS(item.record_id)
          if (record) {
            record.sync_state = "synced"
            record.sync_error = undefined
            await db.savePQRS(record)
          }

          // Remover de cola
          await db.removeSyncQueueItem(item.id!)
        } catch (error) {
          failed++
          console.error("[v0] Failed to sync item:", error)

          if (!item.record_id) {
            console.error("[v0] Cannot retry sync - record_id is missing")
            // Remove invalid item from queue
            if (item.id) {
              await db.removeSyncQueueItem(item.id)
            }
            continue
          }

          // Actualizar intentos
          item.attempts++
          item.last_attempt = new Date().toISOString()
          item.error = error instanceof Error ? error.message : "Unknown error"

          if (item.attempts >= MAX_RETRY_ATTEMPTS) {
            // Marcar como error permanente
            const record = await db.getPQRS(item.record_id)
            if (record) {
              record.sync_state = "error"
              record.sync_error = `Max retry attempts reached: ${item.error}`
              record.sync_attempts = item.attempts
              await db.savePQRS(record)
            }

            // Remover de cola después de max intentos
            await db.removeSyncQueueItem(item.id!)
          } else {
            // Actualizar en cola para reintento
            await db.updateSyncQueueItem(item)

            // Actualizar estado en registro
            const record = await db.getPQRS(item.record_id)
            if (record) {
              record.sync_attempts = item.attempts
              record.last_sync_attempt = item.last_attempt
              await db.savePQRS(record)
            }
          }
        }
      }
    } finally {
      this.isSyncing = false
    }

    console.log(`[v0] Sync complete: ${success} success, ${failed} failed`)
    return { success, failed }
  }

  /**
   * Sincroniza un item específico con Microsoft
   * Este método debe ser adaptado según la integración específica:
   * - SharePoint List REST API
   * - Power Automate HTTP trigger
   * - Microsoft Graph API
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const endpoint = this.getMicrosoftEndpoint()

    console.log(`[v0] Syncing ${item.action} for record ${item.record_id} to ${endpoint}`)

    // Preparar datos para Microsoft
    const payload = this.prepareMicrosoftPayload(item)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Auth header (debe configurarse según el método de autenticación)
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Sync successful:", result)
  }

  /**
   * Obtiene el endpoint de Microsoft según configuración
   * Opciones:
   * 1. SharePoint List REST API
   * 2. Power Automate HTTP trigger
   * 3. Azure Function / Logic App
   */
  private getMicrosoftEndpoint(): string {
    // Para SharePoint List REST API:
    // return `${process.env.NEXT_PUBLIC_SHAREPOINT_SITE}/_api/web/lists/getbytitle('PQRS')/items`;

    // Para Power Automate HTTP trigger:
    // return process.env.NEXT_PUBLIC_POWER_AUTOMATE_WEBHOOK || '';

    // Para Azure Function:
    // return process.env.NEXT_PUBLIC_AZURE_FUNCTION_URL || '';

    // MVP: Endpoint de prueba (reemplazar con real)
    return "/api/pqrs/sync"
  }

  /**
   * Obtiene headers de autenticación
   */
  private getAuthHeaders(): Record<string, string> {
    // Para SharePoint con OAuth:
    // return { 'Authorization': `Bearer ${getAccessToken()}` };

    // Para Power Automate o Azure Functions:
    // Configurar headers de autenticación según necesidad
    // La key debe manejarse desde el servidor, no en el cliente

    // MVP: Sin autenticación (agregar según necesidad)
    return {}
  }

  /**
   * Prepara el payload según el formato esperado por Microsoft
   */
  private prepareMicrosoftPayload(item: SyncQueueItem): any {
    const { data } = item

    // Formato para SharePoint List
    return {
      // Campos básicos
      Title: data.radicado,
      Tipo: data.tipo,
      Clasificacion: data.clasificacion,
      Estado: data.operacion.estado,

      // Ubicación
      Latitud: data.ubicacion.lat,
      Longitud: data.ubicacion.lon,
      Direccion: data.ubicacion.direccion || "",
      Barrio: data.ubicacion.barrio || "",
      Comuna: data.ubicacion.comuna || "",

      // Mediciones
      Largo_m: data.medicion.largo_m,
      Ancho_m: data.medicion.ancho_m,
      Profundidad_cm: data.medicion.profundidad_cm || 0,
      Area_m2: data.medicion.area_m2,

      // Riesgo
      ExposicionPeaton: data.riesgo.exposicion_peaton,
      ExposicionVehiculo: data.riesgo.exposicion_vehiculo,
      VelocidadVia: data.riesgo.velocidad_via,
      ProxEquipamientos: data.riesgo.prox_equipamientos,

      // Severidad
      SeveridadScore: data.severidad.score,
      SeveridadNivel: data.severidad.nivel,
      SLA_Horas: data.severidad.sla_estimado_h,

      // Operación
      Responsable: data.operacion.responsable,
      Cuadrilla: data.operacion.cuadrilla || "",

      // Evidencias (URLs separadas por comas)
      Fotos: data.evidencias.fotos.join(","),
      Video: data.evidencias.video || "",

      // Observaciones
      Observaciones: data.observaciones || "",

      // Metadatos
      Timestamp: data.timestamp,
      FormVersion: data.form_version,
    }
  }

  /**
   * Fuerza sincronización inmediata de un registro
   */
  async syncRecord(record: PQRSRecord): Promise<void> {
    record.sync_state = "queued"
    await db.savePQRS(record)
    await db.addToSyncQueue(record, "create")
    await this.syncPending()
  }

  /**
   * Obtiene el estado de conectividad
   */
  isOnline(): boolean {
    return navigator.onLine
  }
}

export const syncService = new SyncService()
