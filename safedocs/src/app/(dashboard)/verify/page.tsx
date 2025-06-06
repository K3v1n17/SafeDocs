"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
}

export default function VerifyPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [verifying, setVerifying] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [results, setResults] = useState<VerificationResult[]>([
    {
      id: "1",
      fileName: "Cédula_Identidad.pdf",
      status: "verified",
      uploadDate: new Date("2024-01-15"),
      lastModified: new Date("2024-01-15"),
      hash: "sha256:a1b2c3d4e5f6...",
      size: 2048576,
      integrity: 100,
      details: [
        "Firma digital válida",
        "Hash coincide con el original",
        "No se detectaron modificaciones",
        "Metadatos intactos",
      ],
    },
    {
      id: "2",
      fileName: "Contrato_Trabajo.pdf",
      status: "modified",
      uploadDate: new Date("2024-02-01"),
      lastModified: new Date("2024-02-15"),
      hash: "sha256:x1y2z3w4v5u6...",
      size: 1536000,
      integrity: 85,
      details: [
        "Se detectaron modificaciones menores",
        "Cambios en metadatos de fecha",
        "Contenido principal intacto",
        "Posible edición de texto",
      ],
    },
    {
      id: "3",
      fileName: "Pasaporte.jpg",
      status: "corrupted",
      uploadDate: new Date("2024-01-20"),
      lastModified: new Date("2024-01-20"),
      hash: "sha256:corrupted_hash...",
      size: 3072000,
      integrity: 45,
      details: [
        "Archivo dañado detectado",
        "Hash no coincide",
        "Posible corrupción de datos",
        "Se recomienda volver a subir",
      ],
    },
  ])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  const handleVerification = async () => {
    setVerifying(true)
    setVerificationProgress(0)

    const interval = setInterval(() => {
      setVerificationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setVerifying(false)
          return 100
        }
        return prev + 5
      })
    }, 100)
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
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const getIntegrityColor = (integrity: number) => {
    if (integrity >= 95) return "bg-green-500"
    if (integrity >= 80) return "bg-yellow-500"
    return "bg-red-500"
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
                <p className="text-sm text-muted-foreground">Hace 2 horas</p>
              </div>
              <Button onClick={handleVerification} disabled={verifying} className="flex items-center gap-2">
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
                                    : "bg-red-500"
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
