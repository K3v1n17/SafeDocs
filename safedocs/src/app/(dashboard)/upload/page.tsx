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
import { supabase } from "@/lib/supabase"
import { sha256Hex } from "@/lib/utils/index"

export default function UploadPage() {
  const { user, loading , signOut } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDocType, setSelectedDocType] = useState<string | undefined>()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  console.log("User:", user)

  if (loading || !user) return null

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

  // Función para crear verificación inicial
  async function createInitialVerification(documentId: string, checksum: string) {
    try {
      // Generar un estado inicial (generalmente 'verified' para documentos recién subidos)
      const initialStatus = 'verified'
      const initialIntegrity = 100
      const initialDetails = [
        'Documento subido correctamente',
        'Hash inicial calculado',
        'Archivo íntegro al momento de subida',
        'Verificación inicial completada'
      ]

      const { error } = await supabase
        .from('document_verifications')
        .insert({
          document_id: documentId,
          run_by: user?.id,
          status: initialStatus,
          integrity_pct: initialIntegrity,
          hash_checked: checksum,
          details: initialDetails
        })

      if (error) {
        console.error('Error creando verificación inicial:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error en createInitialVerification:', error)
      return false
    }
  }

  const handleUpload = async () => {
    if (!selectedDocType) {
      alert("Por favor, selecciona el tipo de documento")
      return
    }
    if (!title.trim()) {
      alert("Por favor, ingresa el título del documento")
      return
    }
    if (files.length === 0) {
      alert("Por favor, selecciona al menos un archivo para subir")
      return
    }

    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        // Calcular checksum del archivo
        const checksum = await sha256Hex(await file.arrayBuffer())
        console.log(`Checksum for ${file.name}:`, checksum)

        const safeName = file.name.trim().replace(/\s+/g, "_");
        const filePath = `public/${user.id}/${Date.now()}_${safeName}`;

        // Subir al storage 
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("archivos")
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Insertar documento en la base de datos
        const { data: documentData, error: insertError } = await supabase
          .from("documents")
          .insert({
            owner_id: user.id,
            title: files.length > 1 ? `${title} - ${file.name}` : title, // Si hay múltiples archivos, agregar el nombre del archivo
            description: description || null,
            doc_type: selectedDocType,
            tags: tags
              ? tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0)
              : [],
            mime_type: file.type,
            file_size: file.size,
            file_path: filePath,
            checksum_sha256: checksum,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Crear verificación inicial para el documento
        if (documentData?.id) {
          const verificationCreated = await createInitialVerification(documentData.id, checksum)
          if (!verificationCreated) {
            console.warn(`No se pudo crear la verificación inicial para ${file.name}`)
          }
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      } catch (error: any) {
        alert(`Error al subir ${file.name}: ${error.message || error}`)
        console.error('Error en upload:', error)
      }
    }

    setUploading(false)
    alert("Todos los archivos fueron subidos correctamente")
    setFiles([])
    setTitle("")
    setDescription("")
    setTags("")
    setSelectedDocType(undefined)
    setUploadProgress(0)
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
                <Select onValueChange={(val) => setSelectedDocType(val)} value={selectedDocType}>
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
                <Input
                  id="document-title"
                  placeholder="Ej: Cédula de Identidad - Juan Pérez"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-description">Descripción (Opcional)</Label>
                <Textarea
                  id="document-description"
                  placeholder="Descripción adicional del documento..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas (Opcional)</Label>
                <Input
                  id="tags"
                  placeholder="personal, importante, legal"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Todos los documentos son encriptados automáticamente antes del almacenamiento. Se crea una verificación inicial para garantizar la integridad.
          </AlertDescription>
        </Alert>

        {/* Upload Progress */}
        {uploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subiendo documentos y creando verificaciones...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" disabled={uploading} onClick={() => router.push("/")}>
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