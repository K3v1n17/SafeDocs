// 📄 Servicio de documentos - Integración completa con backend NestJS
import { API_CONFIG, buildApiUrl } from '@/config/api'
import { apiClient } from '@/lib/api-client'
import { Document, CreateDocumentData, UpdateDocumentData } from './types'

export interface UploadDocumentData {
  title: string
  file: File
  isPublic?: boolean
  tags?: string[]
}

export interface DocumentFilters {
  type?: string
  dateRange?: {
    start: string
    end: string
  }
  tags?: string[]
  isPublic?: boolean
  verificationStatus?: string
}

export interface DocumentsResponse {
  success: boolean
  data: {
    documents: Document[]
    total: number
    page: number
    limit: number
  }
  error?: string
}

export interface DocumentResponse {
  success: boolean
  data: Document
  error?: string
}

export interface DocumentUploadResponse {
  success: boolean
  data: {
    document: Document
    uploadUrl?: string
  }
  error?: string
}

export interface IDocumentService {
  getDocuments(filters?: DocumentFilters, page?: number, limit?: number): Promise<DocumentsResponse>
  getDocument(id: string): Promise<DocumentResponse>
  uploadDocument(data: UploadDocumentData): Promise<DocumentUploadResponse>
  updateDocument(id: string, data: Partial<Document>): Promise<DocumentResponse>
  deleteDocument(id: string): Promise<{ success: boolean; error?: string }>
  downloadDocument(id: string): Promise<Blob>
  shareDocument(id: string, isPublic: boolean): Promise<DocumentResponse>
  searchDocuments(query: string, filters?: DocumentFilters): Promise<DocumentsResponse>
}

class DocumentService implements IDocumentService {
  private readonly baseURL = buildApiUrl(API_CONFIG.backend.endpoints.documents)

  /**
   * 📋 Obtener lista de documentos con filtros y paginación
   */
  async getDocuments(filters?: DocumentFilters, page = 1, limit = 10): Promise<DocumentsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (filters) {
        if (filters.type) params.append('type', filters.type)
        if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())
        if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus)
        if (filters.tags?.length) params.append('tags', filters.tags.join(','))
        if (filters.dateRange) {
          params.append('startDate', filters.dateRange.start)
          params.append('endDate', filters.dateRange.end)
        }
      }

      const response = await apiClient.get(`${this.baseURL}?${params}`)
      
      // Tu backend devuelve directamente un array de documentos
      if (response.success && Array.isArray(response.data)) {
        return {
          success: true,
          data: {
            documents: response.data,
            total: response.data.length,
            page,
            limit
          }
        }
      }
      
      // Si no es un array, asumir que es el formato esperado
      return response.data || {
        success: false,
        data: {
          documents: [],
          total: 0,
          page,
          limit
        },
        error: 'Formato de respuesta inesperado'
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      return {
        success: false,
        data: {
          documents: [],
          total: 0,
          page,
          limit
        },
        error: error.message || 'Error al obtener documentos'
      }
    }
  }

  /**
   * 📄 Obtener documento por ID
   */
  async getDocument(id: string): Promise<DocumentResponse> {
    try {
      const response = await apiClient.get(`${this.baseURL}/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching document:', error)
      throw new Error(error.response?.data?.message || 'Error al obtener documento')
    }
  }

  /**
   * 📤 Subir nuevo documento
   */
  async uploadDocument(data: UploadDocumentData): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('title', data.title)
      
      if (data.tags?.length) {
        formData.append('tags', JSON.stringify(data.tags))
      }

      // Usar método personalizado para FormData
      const response = await this.uploadFormData(`${this.baseURL}/upload`, formData)
      return response
    } catch (error: any) {
      console.error('Error uploading document:', error)
      throw new Error(error.response?.data?.message || 'Error al subir documento')
    }
  }

  /**
   * 📤 Método auxiliar para subir FormData
   */
  private async uploadFormData(endpoint: string, formData: FormData): Promise<DocumentUploadResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('safedocs_access_token') : null
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Error al subir archivo')
    }
    
    return {
      success: true,
      data: {
        document: result,
        uploadUrl: result.file_path
      }
    }
  }

  /**
   * ✏️ Actualizar documento
   */
  async updateDocument(id: string, data: Partial<Document>): Promise<DocumentResponse> {
    try {
      const response = await apiClient.patch(`${this.baseURL}/${id}`, data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('Error updating document:', error)
      throw new Error(error.response?.data?.message || 'Error al actualizar documento')
    }
  }

  /**
   * 🗑️ Eliminar documento
   */
  async deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`${this.baseURL}/${id}`)
      return {
        success: true
      }
    } catch (error: any) {
      console.error('Error deleting document:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar documento'
      }
    }
  }

  /**
   * 📥 Descargar documento
   */
  async downloadDocument(id: string): Promise<Blob> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('safedocs_access_token') : null
      
      const response = await fetch(`${this.baseURL}/${id}/download`, {
        method: 'GET',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })

      if (!response.ok) {
        throw new Error('Error al descargar documento')
      }

      return await response.blob()
    } catch (error: any) {
      console.error('Error downloading document:', error)
      throw new Error(error.response?.data?.message || 'Error al descargar documento')
    }
  }

  /**
   * 🔗 Compartir documento (cambiar visibilidad)
   */
  async shareDocument(id: string, isPublic: boolean): Promise<DocumentResponse> {
    try {
      const response = await apiClient.patch(`${this.baseURL}/${id}/share`, { isPublic })
      return response.data
    } catch (error: any) {
      console.error('Error sharing document:', error)
      throw new Error(error.response?.data?.message || 'Error al compartir documento')
    }
  }

  /**
   * 🔍 Buscar documentos
   */
  async searchDocuments(query: string, filters?: DocumentFilters): Promise<DocumentsResponse> {
    try {
      const params = new URLSearchParams({
        query,
        page: '1',
        limit: '20'
      })

      if (filters) {
        if (filters.type) params.append('type', filters.type)
        if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())
        if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus)
        if (filters.tags?.length) params.append('tags', filters.tags.join(','))
      }

      const response = await apiClient.get(`${this.baseURL}/search?${params}`)
      return response.data
    } catch (error: any) {
      console.error('Error searching documents:', error)
      throw new Error(error.response?.data?.message || 'Error al buscar documentos')
    }
  }
}

export const documentService = new DocumentService()
