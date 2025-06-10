import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/auth-helpers-nextjs"

export function useOverviewStats(user: User | null) {
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
      
      // Consulta de documentos subidos por el usuario
      const { count: docs, error: docsError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)

      // Consulta de documentos compartidos
      const { count: shared, error: sharedError } = await supabase
        .from("shared_links")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)

      // Consulta de documentos verificados
      const { count: verified, error: verifiedError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("verified", true)

      // Consulta de usuarios autorizados por el usuario
      const { count: authorized, error: authorizedError } = await supabase
        .from("authorized_users")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)

      if (!docsError) setDocumentCount(docs || 0)
      if (!sharedError) setSharedCount(shared || 0)
      if (!verifiedError) setVerifiedCount(verified || 0)
      if (!authorizedError) setAuthorizedUsers(authorized || 0)
      
      setIsLoading(false)
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
