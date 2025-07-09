import { apiClient } from '@/lib/api-client'
import { API_CONFIG } from '@/config/api'

export interface AdminUser {
  id: string
  email: string
  name?: string
  username?: string
  role: 'owner' | 'admin'
  email_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface AdminResponse {
  success: boolean
  data?: AdminUser[]
  error?: string
}

export interface AdminActionResponse {
  success: boolean
  data?: any
  error?: string
}

class AdminService {
  private readonly baseURL = `${API_CONFIG.backend.baseUrl}${API_CONFIG.backend.endpoints.auth}`

  /**
   * 👥 Obtener lista de todos los usuarios (usando tu endpoint existente)
   */
  async getUsers(): Promise<AdminResponse> {
    try {
      const response = await apiClient.get(`${this.baseURL}/admin/users`)
      
      // Verificar la estructura de respuesta del backend
      if (response.success !== false && (response as any).users) {
        // Mapear los datos del endpoint a la estructura esperada
        const users: AdminUser[] = (response as any).users.map((user: any) => ({
          id: user.id,
          email: user.email || `user-${user.id}@example.com`, // Placeholder si no hay email
          name: user.name || user.username || 'Usuario',
          username: user.username || user.id,
          role: user.role as 'owner' | 'admin',
          email_confirmed: true, // Asumimos que están confirmados si tienen rol
          created_at: user.roleAssignedAt || new Date().toISOString(),
          updated_at: user.roleUpdatedAt || new Date().toISOString()
        }))
        
        return {
          success: true,
          data: users
        }
      }
      
      // Si no hay campo 'users' pero hay 'data', intentar usar ese
      if (response.data && Array.isArray(response.data)) {
        const users: AdminUser[] = response.data.map((user: any) => ({
          id: user.id,
          email: user.email || `user-${user.id}@example.com`,
          name: user.name || user.username || 'Usuario',
          username: user.username || user.id,
          role: user.role as 'owner' | 'admin',
          email_confirmed: true,
          created_at: user.roleAssignedAt || new Date().toISOString(),
          updated_at: user.roleUpdatedAt || new Date().toISOString()
        }))
        
        return {
          success: true,
          data: users
        }
      }
      
      // Si la respuesta no tiene success: false, pero tampoco tiene users
      if ((response as any).error || (response as any).message) {
        return {
          success: false,
          error: (response as any).error || (response as any).message || 'Error al obtener usuarios'
        }
      }
      
      return {
        success: false,
        error: 'Estructura de respuesta inesperada'
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al obtener usuarios'
      }
    }
  }

  /**
   * 🔄 Actualizar rol de usuario (usando tu endpoint existente)
   */
  async updateUserRole(userId: string, newRole: string): Promise<AdminActionResponse> {
    try {
      const response = await apiClient.post(`${this.baseURL}/admin/assign-role`, {
        userId: userId,
        role: newRole
      })
      
      // Verificar si la respuesta es exitosa
      if (response.success !== false && (response as any).message) {
        return {
          success: true,
          data: response
        }
      }
      
      // Si hay error en la respuesta
      if ((response as any).error || (response as any).message) {
        return {
          success: false,
          error: (response as any).error || (response as any).message || 'Error al actualizar el rol'
        }
      }
      
      return {
        success: false,
        error: 'Error al actualizar el rol'
      }
    } catch (error: any) {
      console.error('Error updating user role:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al actualizar el rol'
      }
    }
  }

  /**
   * 🗑️ Eliminar usuario 
   */
  async deleteUser(userId: string): Promise<AdminActionResponse> {
    try {
      // Agregar endpoint para eliminar usuarios si no existe
      const response = await apiClient.delete(`${this.baseURL}/admin/users/${userId}`)
      
      if (response.success !== false) {
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: (response as any).error || (response as any).message || 'Error al eliminar el usuario'
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      
      // Si es 404, significa que el endpoint no existe
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Funcionalidad de eliminación no implementada en el backend'
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al eliminar el usuario'
      }
    }
  }

  /**
   * 📊 Obtener estadísticas del sistema
   */
  async getSystemStats(): Promise<AdminActionResponse> {
    try {
      // Usar el endpoint de usuarios y calcular estadísticas
      const usersResponse = await this.getUsers()
      
      if (usersResponse.success && usersResponse.data) {
        const users = usersResponse.data
        const stats = {
          totalUsers: users.length,
          adminUsers: users.filter(u => u.role === 'admin').length,
          ownerUsers: users.filter(u => u.role === 'owner').length,
          activeUsers: users.filter(u => u.email_confirmed).length,
          inactiveUsers: users.filter(u => !u.email_confirmed).length,
          recentlyCreated: users.filter(u => {
            const createdAt = new Date(u.created_at)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return createdAt >= weekAgo
          }).length
        }
        
        return {
          success: true,
          data: stats
        }
      }
      
      return {
        success: false,
        error: usersResponse.error || 'Error al obtener estadísticas'
      }
    } catch (error: any) {
      console.error('Error fetching system stats:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al obtener estadísticas'
      }
    }
  }

  /**
   * 🔍 Buscar usuario por email
   */
  async searchUser(email: string): Promise<AdminActionResponse> {
    try {
      // Obtener todos los usuarios y filtrar por email
      const usersResponse = await this.getUsers()
      
      if (usersResponse.success && usersResponse.data) {
        const user = usersResponse.data.find(u => 
          u.email.toLowerCase().includes(email.toLowerCase()) || 
          u.name?.toLowerCase().includes(email.toLowerCase()) ||
          u.username?.toLowerCase().includes(email.toLowerCase())
        )
        
        if (user) {
          return {
            success: true,
            data: user
          }
        }
      }
      
      return {
        success: false,
        error: 'Usuario no encontrado'
      }
    } catch (error: any) {
      console.error('Error searching user:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al buscar usuario'
      }
    }
  }

  /**
   * 🔒 Cambiar estado de activación de usuario
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<AdminActionResponse> {
    try {
      // Intentar usar un endpoint de toggle status si existe
      const response = await apiClient.post(`${this.baseURL}/admin/toggle-status`, {
        userId: userId,
        isActive: isActive
      })
      
      if (response.success !== false) {
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: (response as any).error || (response as any).message || 'Error al cambiar el estado del usuario'
      }
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      
      // Si es 404, significa que el endpoint no existe
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Funcionalidad de cambio de estado no implementada en el backend'
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al cambiar el estado del usuario'
      }
    }
  }

  /**
   * 📋 Obtener logs de actividad del sistema
   */
  async getActivityLogs(limit: number = 50, offset: number = 0): Promise<AdminActionResponse> {
    try {
      // Intentar usar un endpoint de logs si existe
      const response = await apiClient.get(`${this.baseURL}/admin/activity-logs?limit=${limit}&offset=${offset}`)
      
      if (response.success !== false) {
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: (response as any).error || (response as any).message || 'Error al obtener logs de actividad'
      }
    } catch (error: any) {
      console.error('Error fetching activity logs:', error)
      
      // Si es 404, significa que el endpoint no existe
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Funcionalidad de logs de actividad no implementada en el backend'
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al obtener logs de actividad'
      }
    }
  }

  /**
   * 📊 Obtener métricas del sistema
   */
  async getSystemMetrics(): Promise<AdminActionResponse> {
    try {
      const response = await apiClient.get(`${this.baseURL}/admin/metrics`)
      
      if (response.success !== false) {
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: (response as any).error || (response as any).message || 'Error al obtener métricas'
      }
    } catch (error: any) {
      console.error('Error fetching system metrics:', error)
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Funcionalidad de métricas no implementada en el backend'
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al obtener métricas'
      }
    }
  }

  /**
   * 🔐 Verificar si el usuario actual es administrador
   */
  async checkAdminPermissions(): Promise<AdminActionResponse> {
    try {
      const response = await apiClient.get(`${this.baseURL}/me`)
      
      if (response.success !== false && (response as any).role) {
        const isAdmin = (response as any).role === 'admin'
        
        return {
          success: true,
          data: {
            isAdmin,
            role: (response as any).role,
            user: response
          }
        }
      }
      
      return {
        success: false,
        error: 'No se pudo verificar los permisos de administrador'
      }
    } catch (error: any) {
      console.error('Error checking admin permissions:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al verificar permisos'
      }
    }
  }
}

export const adminService = new AdminService()
