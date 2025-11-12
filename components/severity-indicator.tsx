import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface SeverityIndicatorProps {
  severity: {
    score: number
    nivel: "Baja" | "Media" | "Alta"
    sla_estimado_h: number
  }
}

export function SeverityIndicator({ severity }: SeverityIndicatorProps) {
  const { score, nivel, sla_estimado_h } = severity

  const colors = {
    Baja: {
      bg: "bg-green-50 dark:bg-green-950",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-900 dark:text-green-100",
      badge: "bg-green-600 text-white",
      indicator: "bg-green-600",
    },
    Media: {
      bg: "bg-yellow-50 dark:bg-yellow-950",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-900 dark:text-yellow-100",
      badge: "bg-yellow-600 text-white",
      indicator: "bg-yellow-600",
    },
    Alta: {
      bg: "bg-red-50 dark:bg-red-950",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-900 dark:text-red-100",
      badge: "bg-red-600 text-white",
      indicator: "bg-red-600",
    },
  }

  const color = colors[nivel]
  const slaText = sla_estimado_h === 24 ? "24 horas" : sla_estimado_h === 72 ? "3 días" : "7 días"

  return (
    <Card className={cn("border-2 p-4", color.bg, color.border)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 rounded-full p-2", color.indicator)}>
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className={cn("text-lg font-semibold", color.text)}>Índice de Severidad: {score}</h3>
            <p className={cn("mt-1 text-sm", color.text)}>
              Nivel de prioridad: <span className="font-semibold">{nivel}</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4" />
              <span className={color.text}>SLA estimado: {slaText}</span>
            </div>
          </div>
        </div>
        <Badge className={cn("text-sm", color.badge)}>{nivel}</Badge>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full transition-all", color.indicator)} style={{ width: `${score}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>40</span>
          <span>70</span>
          <span>100</span>
        </div>
      </div>
    </Card>
  )
}
