import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/config/api"
import { AuthUser } from "@/services/auth.service"

export function useOverviewStats(user: AuthUser | null) {
  const [documentCount, setDocumentCount] = useState(0)
  const [sharedCount, setSharedCount] = useState(0)
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [authorizedUsers, setAuthorizedUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      
      try {
        // Obtener estadísticas del dashboard desde el backend
        const response = await apiClient.get('/api/dashboard/stats')
        
        if (response.success && response.data) {
          const stats = response.data
          setDocumentCount(stats.documentCount || 0)
          setSharedCount(stats.sharedCount || 0)
          setVerifiedCount(stats.verifiedCount || 0)
          setAuthorizedUsers(stats.authorizedUsers || 0)
        } else {
          console.error('Error fetching stats:', response.error)
          // Valores por defecto en caso de error
          setDocumentCount(0)
          setSharedCount(0)
          setVerifiedCount(0)
          setAuthorizedUsers(0)
        }
      } catch (error) {
        console.error('Error in fetchStats:', error)
        // Valores por defecto en caso de error
        setDocumentCount(0)
        setSharedCount(0)
        setVerifiedCount(0)
        setAuthorizedUsers(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return {
    stats: {
      documentCount,
      sharedCount,
      verifiedCount,
      authorizedUsers,
    },
    isLoading
  }
}
