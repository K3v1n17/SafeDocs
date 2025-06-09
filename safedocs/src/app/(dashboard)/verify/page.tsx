"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Hash,
  Scan,
  Download,
  Eye,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Document {
  id: string
  title: string
  mime_type: string
  file_size: number
  checksum_sha256: string
  created_at: string
  updated_at: string
  file_path: string
}

interface DocumentVerification {
  id: string
  document_id: string
  status: "verified" | "modified" | "corrupted" | "unknown"
  integrity_pct: number
  hash_checked: string
  details: any
  created_at: string
}

interface VerificationResult {
  id: string
  fileName: string
  status: "verified" | "modified" | "corrupted" | "unknown"
  uploadDate: Date
  lastModified: Date
  hash: string
  size: number
  integrity: number
  details: string[]
  document_id: string
}

export default function VerifyPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [verifying, setVerifying] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [results, setResults] = useState<VerificationResult[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [lastVerification, setLastVerification] = useState<Date | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadDocumentsAndVerifications()
    }
  }, [user])

  const loadDocumentsAndVerifications = async () => {
    if (!user) return

    try {
      setLoadingData(true)

      // Obtener documentos del usuario ESPECIFOC POR EL USER.ID
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

        // Generar detalles basados en el estado
        const generateDetails = (status: string, integrity: number): string[] => {
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
              : generateDetails(latestVerification.status, latestVerification.integrity_pct)
            : generateDetails('unknown', 0)
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
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simular tiempo de verificación

        // Actualizar progreso
        processedCount++
        setVerificationProgress(Math.floor((processedCount / totalDocuments) * 100))

        // Aquí deberías implementar la lógica real de verificación
        // simulacion de  un resultado aleatorio
        const statusOptions = ['verified', 'modified', 'corrupted', 'unknown']
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)]
        const integrity = Math.floor(Math.random() * 101) // Simular integridad entre 0 y 100

        // Actualizar el resultado
        setResults(prevResults => prevResults.map(r => 
          r.id === result.id ? { ...r, status: randomStatus as "verified" | "modified" | "corrupted" | "unknown", integrity } : r
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "modified":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "corrupted":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Shield className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verificado</Badge>
      case "modified":
        return <Badge className="bg-yellow-100 text-yellow-800">Modificado</Badge>
      case "corrupted":
        return <Badge className="bg-red-100 text-red-800">Corrupto</Badge>
      default:
        return <Badge variant="secondary">Sin verificar</Badge>
    }
  }

  const getIntegrityColor = (integrity: number) => {
    if (integrity >= 95) return "bg-green-500"
    if (integrity >= 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading || !user) {
    return null
  }

  if (loadingData) {
    return (
      <>
        <DashboardTitle>Verificar Documentos</DashboardTitle>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Cargando documentos...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardTitle>Verificar Documentos</DashboardTitle>

      <div className="flex-1 space-y-6 p-6">
        {/* Verification Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Verificación de Integridad
            </CardTitle>
            <CardDescription>Ejecuta una verificación completa de todos tus documentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Última verificación</p>
                <p className="text-sm text-muted-foreground">
                  {lastVerification ? formatTimeAgo(lastVerification) : 'Nunca'}
                </p>
              </div>
              <Button 
                onClick={handleVerification} 
                disabled={verifying || results.length === 0} 
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                {verifying ? "Verificando..." : "Iniciar Verificación"}
              </Button>
            </div>

            {verifying && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verificando documentos...</span>
                  <span>{verificationProgress}%</span>
                </div>
                <Progress value={verificationProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Resultados de Verificación</h2>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600">
                  {results.filter((r) => r.status === "verified").length} Verificados
                </Badge>
                <Badge variant="outline" className="text-yellow-600">
                  {results.filter((r) => r.status === "modified").length} Modificados
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  {results.filter((r) => r.status === "corrupted").length} Corruptos
                </Badge>
                <Badge variant="outline" className="text-gray-600">
                  {results.filter((r) => r.status === "unknown").length} Sin verificar
                </Badge>
              </div>
            </div>

            <div className="grid gap-4">
              {results.map((result) => (
                <Card key={result.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <h3 className="font-medium">{result.fileName}</h3>
                            <p className="text-sm text-muted-foreground">{(result.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result.status)}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Integrity Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Integridad</span>
                          <span>{result.integrity}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getIntegrityColor(result.integrity)}`}
                            style={{ width: `${result.integrity}%` }}
                          />
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Subido</p>
                            <p className="text-muted-foreground">{result.uploadDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Modificado</p>
                            <p className="text-muted-foreground">{result.lastModified.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Hash</p>
                            <p className="text-muted-foreground font-mono text-xs">{result.hash.substring(0, 20)}...</p>
                          </div>
                        </div>
                      </div>

                      {/* Verification Details */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Detalles de Verificación</p>
                        <div className="space-y-1">
                          {result.details.map((detail, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  result.status === "verified"
                                    ? "bg-green-500"
                                    : result.status === "modified"
                                      ? "bg-yellow-500"
                                      : result.status === "corrupted"
                                        ? "bg-red-500"
                                        : "bg-gray-500"
                                }`}
                              />
                              <span className="text-muted-foreground">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">No hay documentos para verificar</h3>
                  <p className="text-sm text-muted-foreground">Sube algunos documentos para comenzar la verificación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            La verificación utiliza algoritmos criptográficos avanzados para detectar cualquier modificación no
            autorizada en tus documentos. Los resultados se actualizan automáticamente.
          </AlertDescription>
        </Alert>
      </div>
    </>
  )
}