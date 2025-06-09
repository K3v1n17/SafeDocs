import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { VerificationResult, VerificationStatus } from "../types/verify.types"
import { User } from "@supabase/auth-helpers-nextjs"

export function useVerification(user: User | null) {
  const [verifying, setVerifying] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [results, setResults] = useState<VerificationResult[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [lastVerification, setLastVerification] = useState<Date | null>(null)

  const loadDocumentsAndVerifications = async () => {
    if (!user) return

    try {
      setLoadingData(true)

      // Obtener documentos del usuario
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (docsError) {
        console.error('Error loading documents:', docsError)
        return
      }

      // Obtener verificaciones para cada documento
      const { data: verifications, error: verificationsError } = await supabase
        .from('document_verifications')
        .select('*')
        .in('document_id', documents?.map(doc => doc.id) || [])
        .order('created_at', { ascending: false })

      if (verificationsError) {
        console.error('Error loading verifications:', verificationsError)
        return
      }

      // Combinar documentos con sus verificaciones más recientes
      const combinedResults: VerificationResult[] = documents?.map(doc => {
        const docVerifications = verifications?.filter(v => v.document_id === doc.id) || []
        const latestVerification = docVerifications[0] // Ya están ordenados por fecha descendente

        return {
          id: doc.id,
          document_id: doc.id,
          fileName: doc.title,
          status: latestVerification?.status || 'unknown',
          uploadDate: new Date(doc.created_at),
          lastModified: new Date(doc.updated_at),
          hash: doc.checksum_sha256,
          size: doc.file_size,
          integrity: latestVerification?.integrity_pct || 0,
          details: latestVerification?.details 
            ? Array.isArray(latestVerification.details) 
              ? latestVerification.details 
              : generateDetails(latestVerification.status)
            : generateDetails('unknown')
        }
      }) || []

      setResults(combinedResults)

      // Establecer fecha de última verificación
      if (verifications && verifications.length > 0) {
        const mostRecentVerification = verifications.reduce((latest, current) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        )
        setLastVerification(new Date(mostRecentVerification.created_at))
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleVerification = async () => {
    if (!user) return

    setVerifying(true)
    setVerificationProgress(0)

    try {
      // Simular proceso de verificación
      const totalDocuments = results.length
      let processedCount = 0

      for (const result of results) {
        // Simular verificación de cada documento
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Actualizar progreso
        processedCount++
        setVerificationProgress(Math.floor((processedCount / totalDocuments) * 100))

        // Simulación de resultado aleatorio
        const statusOptions: VerificationStatus[] = ['verified', 'modified', 'corrupted', 'unknown']
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)]
        const integrity = Math.floor(Math.random() * 101)

        // Actualizar el resultado
        setResults(prevResults => prevResults.map(r => 
          r.id === result.id ? { ...r, status: randomStatus, integrity } : r
        ))
      }

      // Actualizar fecha de última verificación
      setLastVerification(new Date())

    } catch (error) {
      console.error('Error during verification:', error)
    } finally {
      setVerifying(false)
      setVerificationProgress(0)
    }
  }

  // Función auxiliar para generar detalles basados en el estado
  const generateDetails = (status: string): string[] => {
    switch (status) {
      case 'verified':
        return [
          'Firma digital válida',
          'Hash coincide con el original',
          'No se detectaron modificaciones',
          'Metadatos intactos'
        ]
      case 'modified':
        return [
          'Se detectaron modificaciones menores',
          'Cambios en metadatos detectados',
          'Contenido principal intacto',
          'Posible edición de contenido'
        ]
      case 'corrupted':
        return [
          'Archivo dañado detectado',
          'Hash no coincide',
          'Posible corrupción de datos',
          'Se recomienda volver a subir'
        ]
      default:
        return ['Sin verificación previa', 'Ejecute una verificación para obtener detalles']
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minutos`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `Hace ${hours} horas`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `Hace ${days} días`
    }
  }

  useEffect(() => {
    if (user) {
      loadDocumentsAndVerifications()
    }
  }, [user])

  return {
    verifying,
    verificationProgress,
    results,
    loadingData,
    lastVerification,
    handleVerification,
    formatTimeAgo
  }
}
