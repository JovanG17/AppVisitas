"use client"

import type React from "react"

import { useRef } from "react"
import { Camera, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoCaptureProps {
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos?: number
}

export function PhotoCapture({ photos, onChange, maxPhotos = 5 }: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPhotos: string[] = []

    for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
      const file = files[i]

      // Comprimir y convertir a base64
      const compressedPhoto = await compressImage(file)
      newPhotos.push(compressedPhoto)
    }

    onChange([...photos, ...newPhotos])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index))
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          // Redimensionar a máximo 1200px manteniendo proporción
          const maxSize = 1200
          let width = img.width
          let height = img.height

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height

          ctx?.drawImage(img, 0, 0, width, height)

          // Comprimir a JPEG con calidad 0.7
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7)
          resolve(compressedDataUrl)
        }

        img.onerror = reject
        img.src = e.target?.result as string
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <img
              src={photo || "/placeholder.svg"}
              alt={`Evidencia ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-muted",
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <Camera className="h-8 w-8" />
            <span className="text-sm font-medium">Tomar foto</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleCapture}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        {photos.length} de {maxPhotos} fotos capturadas
      </p>
    </div>
  )
}
