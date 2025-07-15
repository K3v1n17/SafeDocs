import { API_CONFIG } from '@/config/api'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  skipAuth?: boolean // Para requests que no necesitan autenticación
}

/**
 * 🧹 Limpia cualquier token inseguro que pueda estar en localStorage
 * Esta función se ejecuta automáticamente para mantener la seguridad
 */
const clearInsecureTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Lista de keys inseguras que debemos eliminar
    const insecureKeys = [
      'access_token',
      'refresh_token', 
      'expires_at',
      'expires_in',
      'token_type',
      'user',
      'safedocs_access_token',
      'safedocs_refresh_token',
      'safedocs_expires_at',
      'sb-access-token',
      'sb-refresh-token',
      'supabase.auth.token'
    ];
    
    // Verificar y limpiar localStorage
    insecureKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.warn(`🚨 SEGURIDAD: Eliminando token inseguro "${key}" de localStorage`);
        localStorage.removeItem(key);
      }
    });
    
    // También limpiar sessionStorage de tokens (mantenemos solo datos del usuario)
    const sessionInsecureKeys = [
      'access_token',
      'refresh_token',
      'expires_at',
      'sb-access-token',
      'sb-refresh-token'
    ];
    
    sessionInsecureKeys.forEach(key => {
      if (sessionStorage.getItem(key)) {
        console.warn(`🚨 SEGURIDAD: Eliminando token inseguro "${key}" de sessionStorage`);
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🔒 Limpieza de tokens inseguros completada');
  } catch (error) {
    console.error('Error limpiando tokens inseguros:', error);
  }
};

/**
 * 🌐 Cliente API centralizado con manejo seguro de tokens vía HttpOnly cookies
 * 🔒 Los tokens JWT se manejan automáticamente por el navegador (cookies HttpOnly)
 * 
 * ✅ SEGURO: Tokens nunca expuestos a JavaScript
 * ✅ AUTOMÁTICO: Cookies se envían automáticamente en cada request
 * ✅ PROTEGIDO: Resistente a ataques XSS
 */
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.backend.baseUrl
    
    // 🧹 Limpiar automáticamente cualquier token inseguro al inicializar
    clearInsecureTokens();
  }

  /**
   * 🎯 Realiza una petición HTTP con manejo automático de cookies HttpOnly
   * Los tokens se envían automáticamente vía cookies seguras
   */
  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      skipAuth = false
    } = options

    try {
      // Si el endpoint ya es una URL completa, usarla directamente
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
      
      // Headers base
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      }

      // Configuración de la petición
      const requestConfig: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include', // 🔑 CLAVE: Envía cookies HttpOnly automáticamente
      }

      // Agregar body si existe
      if (body && method !== 'GET') {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body)
      }

      console.log(`🌐 ApiClient - ${method} ${url}`, {
        credentials: 'include',
        hasBody: !!body,
        skipAuth,
        headers: Object.keys(requestHeaders)
      })

      // Realizar la petición
      const response = await fetch(url, requestConfig)
      
      // Log de debugging para cookies
      console.log(`🍪 ApiClient - Response received:`, {
        status: response.status,
        ok: response.ok,
        url,
        method
      })

      let rawResponse: any
      
      try {
        rawResponse = await response.json()
      } catch (parseError) {
        console.error('🚨 ApiClient - Error parsing response JSON:', parseError)
        return {
          success: false,
          error: 'Invalid response format'
        }
      }

      // Si la respuesta no es exitosa
      if (!response.ok) {
        console.warn(`🚨 ApiClient - HTTP ${response.status}:`, {
          url,
          rawResponse
        })
        
        // Para errores 401, la cookie JWT ha expirado o es inválida
        if (response.status === 401) {
          console.warn('🔐 ApiClient - Cookie JWT inválida o expirada (401)')
        }
        
        return {
          success: false,
          error: rawResponse?.error || rawResponse?.message || `HTTP ${response.status}: ${response.statusText}`,
          data: undefined
        }
      }

      // 🔧 ARREGLO: Manejar respuestas que son arrays directos (como documentos)
      let result: ApiResponse<T>
      
      if (Array.isArray(rawResponse)) {
        // Si la respuesta es un array, normalizarla al formato esperado
        console.log(`🔄 ApiClient - Array response detected, normalizing:`, {
          url,
          arrayLength: rawResponse.length
        })
        
        result = {
          success: true,
          data: rawResponse as T,
          error: undefined
        }
      } else if (rawResponse && typeof rawResponse === 'object') {
        // Si la respuesta ya tiene el formato esperado
        if ('success' in rawResponse || 'data' in rawResponse || 'error' in rawResponse) {
          result = rawResponse as ApiResponse<T>
        } else {
          // Si es un objeto pero no tiene la estructura esperada, usarlo como data
          result = {
            success: true,
            data: rawResponse as T,
            error: undefined
          }
        }
      } else {
        // Para otros tipos de respuesta
        result = {
          success: true,
          data: rawResponse as T,
          error: undefined
        }
      }

      console.log(`✅ ApiClient - Success:`, {
        url,
        hasData: !!result.data,
        success: result.success,
        dataType: Array.isArray(result.data) ? 'array' : typeof result.data
      })

      return result

    } catch (error) {
      console.error('🚨 ApiClient - Network/Request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed'
      }
    }
  }

  /**
   * 📡 Métodos de conveniencia para HTTP verbs
   */
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  /**
   * 🚪 Peticiones públicas que no requieren autenticación
   */
  async publicRequest<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, skipAuth: true })
  }

  async postPublic<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.publicRequest<T>(endpoint, { method: 'POST', body })
  }

  async getPublic<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.publicRequest<T>(endpoint, { method: 'GET' })
  }
}

// Exportar instancia singleton
export const apiClient = new ApiClient()

/**
 * 🔄 Función helper para verificar si hay una sesión activa
 * Con cookies HttpOnly, esto se hace verificando con el servidor
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    console.log('🔐 Verificando estado de autenticación con cookies...')
    const response = await apiClient.get('/auth/me')
    const isAuthenticated = response.success && !!response.data
    console.log('🔐 Estado de autenticación:', isAuthenticated)
    return isAuthenticated
  } catch (error) {
    console.error('🚨 Error verificando autenticación:', error)
    return false
  }
}

export default apiClient
