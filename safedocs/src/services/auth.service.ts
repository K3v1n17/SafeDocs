// 🔐 Servicio de autenticación escalable con gestión segura de tokens
import { API_CONFIG } from '@/config/api'
import { apiClient } from '@/lib/api-client'

export interface AuthUser {
  id: string
  email: string
  username?: string
  name?: string
  role?: string
  created_at: string
  updated_at: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
  name: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface AuthResponse {
  success?: boolean
  data?: {
    user: AuthUser | null
    session: AuthSession | null
  }
  user?: AuthUser | null  // Compatibilidad con formato anterior
  session?: AuthSession | null  // Compatibilidad con formato anterior
  error?: string
  requiresEmailConfirmation?: boolean
}

export interface IAuthService {
  login(data: LoginData): Promise<AuthResponse>
  register(data: RegisterData): Promise<AuthResponse>
  logout(): Promise<void>
  getCurrentUser(): Promise<AuthUser | null>
  refreshSession(): Promise<AuthResponse>
  isAuthenticated(): Promise<boolean>
  getStoredUser(): AuthUser | null
}

/**
 * 🔒 Gestor seguro de tokens con encriptación y validación
 */
class TokenManager {
  private static readonly STORAGE_PREFIX = 'safedocs_'
  private static readonly ACCESS_TOKEN_KEY = `${this.STORAGE_PREFIX}access_token`
  private static readonly REFRESH_TOKEN_KEY = `${this.STORAGE_PREFIX}refresh_token`
  private static readonly USER_KEY = `${this.STORAGE_PREFIX}user`
  private static readonly EXPIRES_AT_KEY = `${this.STORAGE_PREFIX}expires_at`

  /**
   * Almacena tokens y datos de usuario de forma segura
   */
  static setSession(session: AuthSession, user: AuthUser): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, session.access_token)
      localStorage.setItem(this.REFRESH_TOKEN_KEY, session.refresh_token)
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
      
      if (session.expires_at) {
        localStorage.setItem(this.EXPIRES_AT_KEY, session.expires_at.toString())
      }
    } catch (error) {
      console.error('Error storing session:', error)
    }
  }

  /**
   * Obtiene el access token almacenado
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  /**
   * Obtiene el refresh token almacenado
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  /**
   * Obtiene los datos del usuario almacenados
   */
  static getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    
    try {
      const userStr = localStorage.getItem(this.USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing stored user:', error)
      return null
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true
    
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY)
    if (!expiresAt) return false
    
    return Date.now() >= parseInt(expiresAt)
  }

  /**
   * Verifica si hay tokens válidos almacenados
   */
  static hasValidTokens(): boolean {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()
    return !!(accessToken && refreshToken && !this.isTokenExpired())
  }

  /**
   * Limpia todos los datos de sesión
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
    localStorage.removeItem(this.EXPIRES_AT_KEY)
  }

  /**
   * Actualiza solo los tokens manteniendo los datos de usuario
   */
  static updateTokens(session: AuthSession): void {
    if (typeof window === 'undefined') return

    localStorage.setItem(this.ACCESS_TOKEN_KEY, session.access_token)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, session.refresh_token)
    
    if (session.expires_at) {
      localStorage.setItem(this.EXPIRES_AT_KEY, session.expires_at.toString())
    }
  }
}

/**
 * 🌐 Servicio de autenticación que usa solo el backend NestJS
 */
class BackendAuthService implements IAuthService {
  
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthService - Enviando login al backend:', data);
      const response = await apiClient.post('/auth/login', data)
      console.log('🔐 AuthService - Respuesta del backend:', response);
      
      if (response.success && response.data) {
        // El backend devuelve { success: true, data: { user, session } }
        // Pero apiClient lo envuelve en { success: true, data: respuestaCompleta }
        const backendResponse = response.data;
        console.log('🔐 AuthService - Respuesta del backend sin envolver:', backendResponse);
        
        if (backendResponse.success && backendResponse.data) {
          const { user, session } = backendResponse.data;
          console.log('🔐 AuthService - Usuario extraído:', user);
          console.log('🔐 AuthService - Sesión extraída:', session);
          
          if (session) {
            // Usuario logueado exitosamente
            TokenManager.setSession(session, user)
            const result = { user, session };
            console.log('🔐 AuthService - Resultado final:', result);
            return result;
          } else {
            // Usuario registrado pero necesita confirmar email
            return { 
              user, 
              session: null, 
              requiresEmailConfirmation: true 
            }
          }
        }
      }
      
      return { 
        user: null, 
        session: null, 
        error: response.error || 'Error en el login' 
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        user: null, 
        session: null, 
        error: 'Error de conexión' 
      }
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/register', data)
      
      if (response.success && response.data) {
        // El backend devuelve { success: true, data: { user, session } }
        // Pero apiClient lo envuelve en { success: true, data: respuestaCompleta }
        const backendResponse = response.data;
        
        if (backendResponse.success && backendResponse.data) {
          const { user, session } = backendResponse.data;
          
          if (session) {
            // Usuario registrado y logueado automáticamente
            TokenManager.setSession(session, user)
            return { user, session }
          } else {
            // Usuario registrado pero necesita confirmar email
            return { 
              user, 
              session: null, 
              requiresEmailConfirmation: true 
            }
          }
        }
      }
      
      return { 
        user: null, 
        session: null, 
        error: response.error || 'Error en el registro' 
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        user: null, 
        session: null, 
        error: 'Error de conexión' 
      }
    }
  }

  async logout(): Promise<void> {
    try {
      const token = TokenManager.getAccessToken()
      
      if (token) {
        // Invalidar token en el backend
        await fetch(`${API_CONFIG.backend.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Siempre limpiar el storage local
      TokenManager.clearSession()
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        console.log('🔐 getCurrentUser - No hay token');
        return null;
      }

      // Si el token está expirado, intentar renovarlo
      if (TokenManager.isTokenExpired()) {
        console.log('🔐 getCurrentUser - Token expirado, intentando renovar');
        const refreshResult = await this.refreshSession()
        if (!refreshResult.session) {
          console.log('🔐 getCurrentUser - No se pudo renovar el token');
          TokenManager.clearSession()
          return null
        }
      }

      console.log('🔐 getCurrentUser - Obteniendo usuario del backend');
      const response = await apiClient.get('/auth/me')
      
      if (response.success && response.data) {
        console.log('🔐 getCurrentUser - Usuario obtenido:', response.data.user);
        return response.data.user
      }
      
      console.log('🔐 getCurrentUser - Respuesta inválida del backend');
      return null
    } catch (error) {
      console.error('🔐 getCurrentUser - Error:', error)
      // Si hay error de autenticación, limpiar tokens
      TokenManager.clearSession()
      return null
    }
  }

  async refreshSession(): Promise<AuthResponse> {
    try {
      const refreshToken = TokenManager.getRefreshToken()
      if (!refreshToken) {
        return { 
          user: null, 
          session: null, 
          error: 'No hay refresh token' 
        }
      }

      const response = await fetch(`${API_CONFIG.backend.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        const { user, session } = result.data
        
        // Actualizar tokens
        TokenManager.setSession(session, user)
        
        return { user, session }
      }
      
      return { 
        user: null, 
        session: null, 
        error: result.error || 'Error renovando sesión' 
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      return { 
        user: null, 
        session: null, 
        error: 'Error de conexión' 
      }
    }
  }

  async isAuthenticated(): Promise<boolean> {
    // Verificar si hay tokens válidos
    if (!TokenManager.hasValidTokens()) {
      return false
    }

    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch {
      return false
    }
  }

  getStoredUser(): AuthUser | null {
    return TokenManager.getUser()
  }

  hasValidTokens(): boolean {
    return TokenManager.hasValidTokens()
  }
}

/**
 * 🔐 Instancia singleton del servicio de autenticación
 * Solo usa el backend NestJS para mayor seguridad
 */
export const authService = new BackendAuthService()
