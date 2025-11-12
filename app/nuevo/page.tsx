"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { StepIndicator } from "@/components/step-indicator"
import { Step1Location } from "@/components/forms/step1-location"
import { Step2Classification } from "@/components/forms/step2-classification"
import { Step3Review } from "@/components/forms/step3-review"
import type { PQRSRecord } from "@/lib/db"
import { generateRadicado } from "@/lib/radicado-generator"

export default function NuevoRegistroPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<PQRSRecord>>({
    radicado: generateRadicado(),
    tipo: "Queja",
    canal_origen: "App",
    timestamp: new Date().toISOString(),
    form_version: "1.0",
    sync_state: "local_only",
    operacion: {
      responsable: "",
      estado: "Borrador",
    },
    evidencias: {
      fotos: [],
    },
  })

  const handleNext = (stepData: Partial<PQRSRecord>) => {
    setFormData((prev) => ({ ...prev, ...stepData }))
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleComplete = async (finalData: Partial<PQRSRecord>) => {
    try {
      const { db } = await import("@/lib/db")
      await db.init()

      const completeRecord: PQRSRecord = {
        ...formData,
        ...finalData,
      } as PQRSRecord

      const id = await db.savePQRS(completeRecord)
      console.log("[v0] Record saved:", id)

      router.push(`/detalle/${id}`)
    } catch (error) {
      console.error("[v0] Error saving record:", error)
      alert("Error al guardar el registro. Por favor, intente nuevamente.")
    }
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
              <h1 className="text-xl font-bold">Nuevo Registro PQRS</h1>
              <p className="text-sm text-muted-foreground">{formData.radicado}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <StepIndicator currentStep={currentStep} totalSteps={3} />

        <Card className="mt-6 p-6">
          {currentStep === 1 && <Step1Location initialData={formData} onNext={handleNext} />}
          {currentStep === 2 && <Step2Classification initialData={formData} onNext={handleNext} onBack={handleBack} />}
          {currentStep === 3 && <Step3Review data={formData} onComplete={handleComplete} onBack={handleBack} />}
        </Card>
      </main>
    </div>
  )
}
