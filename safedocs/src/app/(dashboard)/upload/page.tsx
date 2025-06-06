"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, ImageIcon, File, AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UploadPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  const documentTypes = [
    "Cédula de Identidad",
    "Pasaporte",
    "Título de Propiedad",
    "Escritura Notarial",
    "Contrato",
    "Certificado",
    "Otro",
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    setUploading(true)
    setUploadProgress(0)

    // Simular progreso de subida
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return ImageIcon
    if (file.type === "application/pdf") return FileText
    return File
  }

  return (
    <>
      <DashboardTitle>Subir Documentos</DashboardTitle>

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Archivos</CardTitle>
              <CardDescription>Arrastra y suelta archivos o haz clic para seleccionar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selecciona archivos para subir</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG hasta 10MB cada uno</p>
                </div>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="mt-4"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Archivos Seleccionados ({files.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => {
                      const FileIcon = getFileIcon(file)
                      return (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <FileIcon className="h-4 w-4" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Documento</CardTitle>
              <CardDescription>Proporciona detalles sobre los documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-type">Tipo de Documento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-title">Título del Documento</Label>
                <Input id="document-title" placeholder="Ej: Cédula de Identidad - Juan Pérez" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-description">Descripción (Opcional)</Label>
                <Textarea id="document-description" placeholder="Descripción adicional del documento..." rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas (Opcional)</Label>
                <Input id="tags" placeholder="personal, importante, legal" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Todos los documentos son encriptados automáticamente antes del almacenamiento. Solo tú y las personas
            autorizadas pueden acceder a ellos.
          </AlertDescription>
        </Alert>

        {/* Upload Progress */}
        {uploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subiendo documentos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
            {uploading ? (
              <>Subiendo...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Documentos
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
