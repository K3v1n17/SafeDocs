import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { documentService, historyService } from "@/services"
import { UploadMetadata } from "../types/Documents.types"
import { sha256Hex } from "@/lib/utils/index"
import { API_CONFIG } from "@/config/api"

export function useDocumentUpload() {
  const { user } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [metadata, setMetadata] = useState<UploadMetadata>({
    docType: undefined,
    title: "",
    description: "",
    tags: ""
  })

  const resetForm = () => {
    setFiles([])
    setMetadata({
      docType: undefined,
      title: "",
      description: "",
      tags: ""
    })
    setUploadProgress(0)
  }

  // Función para crear verificación inicial usando el backend
  async function createInitialVerification(documentId: string, checksum: string) {
    try {
      const initialStatus = 'verified'
      const initialIntegrity = 100
      const initialDetails = [
        'Documento subido correctamente',
        'Hash inicial calculado',
        'Archivo íntegro al momento de subida',
        'Verificación inicial completada'
      ]

      // Crear verificación a través del backend de verificaciones
      const response = await fetch(`${API_CONFIG.backend.baseUrl}/api/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('safedocs_access_token')}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          run_by: user?.id,
          status: initialStatus,
          integrity_pct: initialIntegrity,
          hash_checked: checksum,
          details: initialDetails
        })
      })

      if (response.ok) {
        return true
      }

      return false
    } catch (error) {
      console.error('Error en createInitialVerification:', error)
      return false
    }
  }

  const handleUpload = async (): Promise<boolean> => {
    if (!metadata.docType) {
      alert("Por favor, selecciona el tipo de documento")
      return false
    }
    if (!metadata.title.trim()) {
      alert("Por favor, ingresa el título del documento")
      return false
    }
    if (files.length === 0) {
      alert("Por favor, selecciona al menos un archivo para subir")
      return false
    }

    setUploading(true)
    setUploadProgress(0)
    let success = true

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        // Calcular checksum del archivo
        const checksum = await sha256Hex(await file.arrayBuffer())
        
        // Crear FormData para enviar el archivo al backend
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', files.length > 1 ? `${metadata.title} - ${file.name}` : metadata.title)
        formData.append('description', metadata.description || '')
        formData.append('doc_type', metadata.docType!)
        formData.append('checksum_sha256', checksum)
        
        if (metadata.tags) {
          const tags = metadata.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
          formData.append('tags', JSON.stringify(tags))
        }

        // Subir archivo y crear documento a través del backend
        const response = await fetch(`${API_CONFIG.backend.baseUrl}${API_CONFIG.backend.endpoints.documents}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('safedocs_access_token')}`,
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const documentData = await response.json()

        // Crear entrada en el historial
        await historyService.create({
          action: "upload",
          document_id: documentData.id,
          details: `Documento "${documentData.title}" subido exitosamente`,
        })

        // Crear verificación inicial para el documento (mantener Supabase para verificaciones)
        if (documentData?.id) {
          const verificationCreated = await createInitialVerification(documentData.id, checksum)
          if (!verificationCreated) {
            console.warn(`No se pudo crear la verificación inicial para ${file.name}`)
          }
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      } catch (error: unknown) {
        let errorMessage = "Error desconocido"
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === "string") {
          errorMessage = error
        }
        alert(`Error al subir ${file.name}: ${errorMessage}`)
        console.error('Error en upload:', error)
        success = false
      }
    }

    setUploading(false)
    if (success) {
      alert("Todos los archivos fueron subidos correctamente")
      resetForm()
    }
    return success
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMetadata = (field: keyof UploadMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }))
  }

  return {
    files,
    metadata,
    uploading,
    uploadProgress,
    handleFileSelect,
    removeFile,
    updateMetadata,
    handleUpload,
    resetForm
  }
}
