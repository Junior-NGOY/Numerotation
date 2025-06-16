"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, File, Image, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  onFileRemove: (index: number) => void
  selectedFiles: File[]
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // en MB
  label?: string
  description?: string
  className?: string
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFiles,
  accept = "image/*,.pdf,.doc,.docx",
  multiple = false,
  maxFiles = 5,
  maxSize = 10,
  label = "Sélectionner des fichiers",
  description = "Glissez-déposez des fichiers ici ou cliquez pour sélectionner",
  className
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []

    for (const file of fileArray) {
      // Vérifier la taille
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Le fichier "${file.name}" est trop volumineux. Taille maximale: ${maxSize}MB`)
        continue
      }

      // Vérifier le nombre maximum de fichiers
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        alert(`Nombre maximum de fichiers autorisés: ${maxFiles}`)
        break
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      if (multiple) {
        onFileSelect([...selectedFiles, ...validFiles])
      } else {
        onFileSelect(validFiles.slice(0, 1))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset input value pour permettre de sélectionner le même fichier
    e.target.value = ''
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <Card
          className={cn(
            "mt-2 border-2 border-dashed transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            "hover:border-primary/50 cursor-pointer"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 px-4">
            <Upload className={cn(
              "h-8 w-8 mb-2",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="text-sm text-center text-muted-foreground mb-2">
              {description}
            </p>
            <p className="text-xs text-muted-foreground">
              Formats acceptés: {accept.split(',').join(', ')} | Taille max: {maxSize}MB
              {multiple && ` | Max ${maxFiles} fichiers`}
            </p>
          </CardContent>
        </Card>

        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Fichiers sélectionnés ({selectedFiles.length})
          </Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFileRemove(index)
                    }}
                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
