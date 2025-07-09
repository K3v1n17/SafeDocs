import { API_CONFIG, getAuthHeaders } from '@/config/api'

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
  token?: string
  skipAuth?: boolean // Para requests que no necesitan autenticación
}

/**
 * 🌐 Cliente API centralizado con manejo automático de tokens
 */
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.backend.baseUrl
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('safedocs_access_token')
  }

  /**
   * Verifica si el token ha expirado
   */
  private isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true
    
    const expiresAt = localStorage.getItem('safedocs_expires_at')
    if (!expiresAt) return false
    
    return Date.now() >= parseInt(expiresAt)
  }

  /**
   * Intenta refrescar el token automáticamente
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    const refreshToken = localStorage.getItem('safedocs_refresh_token')
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      const result = await response.json()
      
      if (result.success && result.data?.session) {
        const { session, user } = result.data
        
        // Actualizar tokens en localStorage
        localStorage.setItem('safedocs_access_token', session.access_token)
        localStorage.setItem('safedocs_refresh_token', session.refresh_token)
        localStorage.setItem('safedocs_user', JSON.stringify(user))
        
        if (session.expires_at) {
          localStorage.setItem('safedocs_expires_at', session.expires_at.toString())
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      token,
      skipAuth = false
    } = options

    try {
      // Obtener token automáticamente si no se proporciona uno
      let authToken = token
      
      if (!skipAuth && !authToken) {
        authToken = this.getStoredToken() || undefined
        
        // Si el token está expirado, intentar renovarlo
        if (authToken && this.isTokenExpired()) {
          const refreshed = await this.tryRefreshToken()
          if (refreshed) {
            authToken = this.getStoredToken() || undefined
          } else {
            // Si no se pudo renovar, limpiar tokens inválidos
            localStorage.removeItem('safedocs_access_token')
            localStorage.removeItem('safedocs_refresh_token')
            localStorage.removeItem('safedocs_user')
            localStorage.removeItem('safedocs_expires_at')
            authToken = undefined
          }
        }
      }

      const config: RequestInit = {
        method,
        headers: {
          ...getAuthHeaders(authToken),
          ...headers,
        },
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      }

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body)
      }

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
      const response = await fetch(url, config)

      // Si es 401 y no hemos intentado refresh, intentarlo una vez
      if (response.status === 401 && !skipAuth && authToken) {
        const refreshed = await this.tryRefreshToken()
        if (refreshed) {
          // Reintentar la request original con el nuevo token
          const newToken = this.getStoredToken() || undefined
          return this.request(endpoint, { ...options, token: newToken })
        } else {
          // Refresh falló, limpiar storage
          localStorage.removeItem('safedocs_access_token')
          localStorage.removeItem('safedocs_refresh_token')
          localStorage.removeItem('safedocs_user')
          localStorage.removeItem('safedocs_expires_at')
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }))
        
        return {
          success: false,
          error: errorData.error || errorData.message || 'Error en la petición',
          data: undefined
        }
      }

      const data = await response.json()
      
      return {
        success: true,
        data,
        error: undefined
      }

    } catch (error) {
      console.error('API Error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
        data: undefined
      }
    }
  }

  // 🔐 Métodos de conveniencia con autenticación automática
  async get<T = any>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', token })
  }

  async post<T = any>(endpoint: string, body?: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, token })
  }

  async put<T = any>(endpoint: string, body?: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, token })
  }

  async delete<T = any>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', token })
  }

  async patch<T = any>(endpoint: string, body?: any, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, token })
  }

  // 🌐 Métodos sin autenticación (para login/register)
  async postPublic<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, skipAuth: true })
  }

  async getPublic<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', skipAuth: true })
  }
}

// 🔐 Instancia singleton del cliente API
export const apiClient = new ApiClient()
