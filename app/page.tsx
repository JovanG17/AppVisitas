import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Plus, List } from "lucide-react"
import { NetworkStatus } from "@/components/network-status"
import { RecentRecords } from "@/components/recent-records"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">PQRS Medellín</h1>
              <p className="text-sm text-muted-foreground">Sistema de Registro en Campo</p>
            </div>
            <NetworkStatus />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/nuevo" className="block">
            <Card className="group cursor-pointer border-2 p-6 transition-all hover:border-primary hover:shadow-lg">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-primary p-4 text-primary-foreground transition-transform group-hover:scale-110">
                  <Plus className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Nuevo Registro</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Crear nueva PQRS en campo</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/lista" className="block">
            <Card className="group cursor-pointer border-2 p-6 transition-all hover:border-primary hover:shadow-lg">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-secondary p-4 text-secondary-foreground transition-transform group-hover:scale-110">
                  <List className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Ver Registros</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Consultar registros guardados</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Registros Recientes</h2>
          <RecentRecords />
        </div>
      </main>
    </div>
  )
}
