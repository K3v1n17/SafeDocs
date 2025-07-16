import { apiClient } from '@/lib/api-client';

// === INTERFACES ===
export interface CreateSecureShare {
  sharedWithUserId: string;
  title?: string;
  message?: string;
  expiresAt?: string; // ISO date string
}

export interface UserForSharing {
  id: string;
  name: string;
  avatar?: string;
  company?: string;
}

export interface UserSearchResponse {
  users: UserForSharing[];
  message?: string;
  error?: string;
}

export interface SharedUser {
  shareId: string;
  userId: string;
  name: string;
  company?: string;
  avatar?: string;
  permission: 'read' | 'comment';
  expiresAt?: string;
  sharedAt: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  created_by: string;
  shared_with_user_id: string;
  share_token: string;
  title?: string;
  message?: string;
  expires_at?: string;
  is_active: boolean;
  permission_level: 'read' | 'comment';
  created_at: string;
  share_url: string; // URL completa para compartir
}

export interface SharedDocument {
  share: {
    id: string;
    title?: string;
    message?: string;
    permission_level: 'read' | 'comment';
    created_at: string;
    expires_at?: string;
  };
  document: {
    id: string;
    titulo: string;
    contenido?: string;
    tipo: string;
    file_size?: number;
    mime_type?: string;
    created_at: string;
    signed_file_url: string; // URL temporal para descargar/ver archivo
  };
}

export interface SharedWithMe {
  id: string;
  share_token: string;
  title?: string;
  message?: string;
  expires_at?: string;
  created_at: string;
  documents: {
    titulo: string;
    contenido?: string;
    tipo: string;
    created_at: string;
  };
}

// === SERVICIO ===
export const documentShareService = {
  // Crear compartir seguro
  async createSecureShare(documentId: string, shareData: CreateSecureShare): Promise<DocumentShare> {
    const response = await apiClient.post(`/documentos/${documentId}/secure-share`, shareData);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as DocumentShare;
  },

  // Obtener documento compartido por token
  async getSharedDocument(shareToken: string): Promise<SharedDocument> {
    const response = await apiClient.get(`/documentos/shared/${shareToken}`);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as SharedDocument;
  },

  // Obtener documentos compartidos conmigo
  async getSharedWithMe(): Promise<SharedWithMe[]> {
    const response = await apiClient.get('/documentos/shared-with-me');
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as SharedWithMe[];
  },

  // Revocar compartir
  async revokeShare(shareId: string): Promise<void> {
    const response = await apiClient.delete(`/documentos/shares/${shareId}/revoke`);
    if (response.error) {
      throw new Error(response.error);
    }
  },

  // Obtener usuarios para compartir - usando búsqueda segura
  async searchUsersForSharing(query: string): Promise<UserSearchResponse> {
    if (!query || query.length < 3) {
      return {
        users: [],
        message: 'Escribe al menos 3 caracteres para buscar'
      };
    }

    const response = await apiClient.get(`/share/search-users?q=${encodeURIComponent(query)}`);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as UserSearchResponse;
  },

  // Obtener usuarios que ya tienen acceso a un documento
  async getDocumentSharedUsers(documentId: string): Promise<{ users: any[], error?: string }> {
    const response = await apiClient.get(`/share/document-users/${documentId}`);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as { users: any[], error?: string };
  }
};
