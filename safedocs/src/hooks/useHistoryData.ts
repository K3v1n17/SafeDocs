import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { documentService, historyService } from '@/services'
import { Document, HistoryEntry } from '@/services/types'

export interface UseHistoryDataReturn {
  documents: Document[]
  historyEntries: HistoryEntry[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  handleDeleteDocument: (documentId: string, documentTitle: string) => Promise<void>
  handleUpdateDocument: (documentId: string, updateData: {
    title?: string
    description?: string
    doc_type?: string
    tags?: string[]
  }) => Promise<void>
}

export const useHistoryData = (): UseHistoryDataReturn => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)

      const [documentsData, historyData] = await Promise.all([
        documentService.getDocuments(), // Cambio: usar método correcto
        historyService.getHistory(user.id) // Cambio: usar método correcto
      ])

      setHistoryEntries(historyData.data?.entries || [])
      setDocuments(documentsData.data?.documents || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el documento "${documentTitle}"?`)) {
      return
    }

    if (!user?.id) {
      throw new Error("Usuario no autenticado")
    }

    try {
      await documentService.deleteDocument(documentId)
      
      // Registrar la acción en el historial
      await historyService.create({
        action: "delete",
        document_id: documentId,
        details: `Documento "${documentTitle}" eliminado`,
      })

      // Refrescar datos
      await fetchData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      throw new Error(`Error al eliminar el documento: ${errorMessage}`)
    }
  }

  const handleUpdateDocument = async (
    documentId: string, 
    updateData: {
      title?: string
      description?: string
      doc_type?: string
      tags?: string[]
    }
  ) => {
    if (!user?.id) {
      throw new Error("Usuario no autenticado")
    }

    try {
      await documentService.updateDocument(documentId, updateData)
      
      // Registrar la acción en el historial
      await historyService.create({
        action: "upload", // Cambio: usar acción permitida por el tipo
        document_id: documentId,
        details: `Documento "${updateData.title || 'Sin título'}" actualizado`,
      })

      // Refrescar datos
      await fetchData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      throw new Error(`Error al actualizar el documento: ${errorMessage}`)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  return {
    documents,
    historyEntries,
    loading,
    error,
    refetch: fetchData,
    handleDeleteDocument,
    handleUpdateDocument,
  }
}
