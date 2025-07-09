// 🔧 Configuración centralizada para los servicios de API
export const API_CONFIG = {
  // Solo modo backend - sin Supabase
  mode: 'backend' as const,
  
  // URLs de tu backend NestJS
  backend: {
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
    endpoints: {
      documents: '/documentos',      // Para CRUD de documentos
      history: '/api/history',       // Para logs y historial
      auth: '/auth',                 // Para autenticación
      users: '/api/users',
      verification: '/api/verification',
      chat: '/api/chat',
      sharing: '/api/sharing',
    }
  },
  
  // Configuración para headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Timeout para las requests
  timeout: 10000,
}

// Helper para construir URLs del backend
export const buildApiUrl = (endpoint: string) => {
  return `${API_CONFIG.backend.baseUrl}${endpoint}`
}

// Helper para obtener headers con autenticación
export const getAuthHeaders = (token?: string) => {
  return {
    ...API_CONFIG.defaultHeaders,
    ...(token && { Authorization: `Bearer ${token}` })
  }
}
