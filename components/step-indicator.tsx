import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "Ubicación" },
    { number: 2, label: "Clasificación" },
    { number: 3, label: "Revisión" },
  ]

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.number} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors sm:h-12 sm:w-12",
                step.number < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.number === currentStep
                    ? "border-primary bg-background text-primary"
                    : "border-muted-foreground/30 bg-background text-muted-foreground",
              )}
            >
              {step.number < currentStep ? <Check className="h-5 w-5" /> : <span>{step.number}</span>}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium sm:text-sm",
                step.number <= currentStep ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-0.5 flex-1 transition-colors",
                step.number < currentStep ? "bg-primary" : "bg-muted-foreground/30",
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
