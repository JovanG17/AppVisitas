// IndexedDB wrapper for offline-first storage
const DB_NAME = "pqrs_medellin"
const DB_VERSION = 1
const STORE_PQRS = "pqrs_records"
const STORE_SYNC_QUEUE = "sync_queue"

export interface PQRSRecord {
  id?: string
  radicado: string
  tipo: "Petición" | "Queja" | "Reclamo" | "Sugerencia" | "Denuncia"
  canal_origen?: "App" | "Línea" | "Web" | "Presencial" | "Otro"
  ubicacion: {
    lat: number
    lon: number
    direccion?: string
    barrio?: string
    comuna?: string
    codigo_via?: string
  }
  clasificacion:
    | "Calzada"
    | "Andén"
    | "Señalización"
    | "Drenaje"
    | "Espacio público"
    | "Alumbrado"
    | "Vegetación"
    | "Otro"
  medicion: {
    largo_m: number
    ancho_m: number
    profundidad_cm?: number
    area_m2: number
  }
  riesgo: {
    exposicion_peaton: 0 | 1 | 2 | 3
    exposicion_vehiculo: 0 | 1 | 2 | 3
    velocidad_via: 0 | 1 | 2 | 3
    prox_equipamientos: 0 | 1 | 2
  }
  contexto?: {
    antiguedad_dias: number
    reincidencia: 0 | 1 | 2
    via_critica: 0 | 1
  }
  severidad: {
    score: number
    nivel: "Baja" | "Media" | "Alta"
    sla_estimado_h: number
  }
  evidencias: {
    fotos: string[]
    video?: string
  }
  operacion: {
    responsable: string
    cuadrilla?: string
    estado: "Borrador" | "Registrado" | "Enviado" | "Atendido"
  }
  observaciones?: string
  timestamp: string
  form_version: string
  sync_state: "local_only" | "queued" | "synced" | "error"
  sync_error?: string
  sync_attempts?: number
  last_sync_attempt?: string
}

export interface SyncQueueItem {
  id?: number
  record_id: string
  action: "create" | "update"
  data: PQRSRecord
  attempts: number
  last_attempt?: string
  error?: string
  created_at: string
}

class Database {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // PQRS Records store
        if (!db.objectStoreNames.contains(STORE_PQRS)) {
          const pqrsStore = db.createObjectStore(STORE_PQRS, {
            keyPath: "id",
            autoIncrement: false,
          })
          pqrsStore.createIndex("radicado", "radicado", { unique: true })
          pqrsStore.createIndex("sync_state", "sync_state", { unique: false })
          pqrsStore.createIndex("timestamp", "timestamp", { unique: false })
          pqrsStore.createIndex("severidad_nivel", "severidad.nivel", { unique: false })
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORE_SYNC_QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          })
          syncStore.createIndex("record_id", "record_id", { unique: false })
          syncStore.createIndex("created_at", "created_at", { unique: false })
        }
      }
    })
  }

  async savePQRS(record: PQRSRecord): Promise<string> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PQRS], "readwrite")
      const store = transaction.objectStore(STORE_PQRS)

      if (!record.id) {
        record.id = this.generateId()
      }

      const request = store.put(record)

      request.onsuccess = () => resolve(record.id!)
      request.onerror = () => reject(request.error)
    })
  }

  async getPQRS(id: string): Promise<PQRSRecord | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PQRS], "readonly")
      const store = transaction.objectStore(STORE_PQRS)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllPQRS(): Promise<PQRSRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PQRS], "readonly")
      const store = transaction.objectStore(STORE_PQRS)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getPQRSByState(state: PQRSRecord["sync_state"]): Promise<PQRSRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PQRS], "readonly")
      const store = transaction.objectStore(STORE_PQRS)
      const index = store.index("sync_state")
      const request = index.getAll(state)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deletePQRS(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PQRS], "readwrite")
      const store = transaction.objectStore(STORE_PQRS)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async addToSyncQueue(record: PQRSRecord, action: "create" | "update"): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SYNC_QUEUE], "readwrite")
      const store = transaction.objectStore(STORE_SYNC_QUEUE)

      const queueItem: SyncQueueItem = {
        record_id: record.id!,
        action,
        data: record,
        attempts: 0,
        created_at: new Date().toISOString(),
      }

      const request = store.add(queueItem)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SYNC_QUEUE], "readonly")
      const store = transaction.objectStore(STORE_SYNC_QUEUE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SYNC_QUEUE], "readwrite")
      const store = transaction.objectStore(STORE_SYNC_QUEUE)
      const request = store.put(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SYNC_QUEUE], "readwrite")
      const store = transaction.objectStore(STORE_SYNC_QUEUE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const db = new Database()
