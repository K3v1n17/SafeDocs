import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { UploadMetadata } from "../types/Documents.types"
import { sha256Hex } from "@/lib/utils/index"

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

  // Función para crear verificación inicial
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
        
        const safeName = file.name.trim().replace(/\s+/g, "_");
        const filePath = `public/${user?.id}/${Date.now()}_${safeName}`;

        // Subir al storage 
        const { error: uploadError } = await supabase.storage
          .from("archivos")
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Insertar documento en la base de datos
        const { data: documentData, error: insertError } = await supabase
          .from("documents")
          .insert({
            owner_id: user?.id,
            title: files.length > 1 ? `${metadata.title} - ${file.name}` : metadata.title,
            description: metadata.description || null,
            doc_type: metadata.docType,
            tags: metadata.tags
              ? metadata.tags
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
