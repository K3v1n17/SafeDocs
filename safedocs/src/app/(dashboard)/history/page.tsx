"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  History,
  Search,
  Filter,
  Upload,
  Download,
  Share2,
  Shield,
  Eye,
  Trash2,
  User,
  FileText,
  Clock,
} from "lucide-react"

interface HistoryEntry {
  id: string
  action: "upload" | "download" | "share" | "verify" | "view" | "delete"
  document: string
  user: string
  timestamp: Date
  details: string
  ipAddress: string
  userAgent: string
}

export default function HistoryPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterDate, setFilterDate] = useState("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  const historyEntries: HistoryEntry[] = [
    {
      id: "1",
      action: "upload",
      document: "Cédula_Identidad.pdf",
      user: "Usuario Safedocs",
      timestamp: new Date("2024-06-01T10:30:00"),
      details: "Documento subido exitosamente",
      ipAddress: "192.168.1.100",
      userAgent: "Chrome 125.0.0.0",
    },
    {
      id: "2",
      action: "verify",
      document: "Cédula_Identidad.pdf",
      user: "Sistema",
      timestamp: new Date("2024-06-01T10:31:00"),
      details: "Verificación automática completada - Documento íntegro",
      ipAddress: "Sistema",
      userAgent: "Sistema",
    },
    {
      id: "3",
      action: "share",
      document: "Contrato_Arrendamiento.pdf",
      user: "Usuario Safedocs",
      timestamp: new Date("2024-06-01T14:15:00"),
      details: "Documento compartido con ana@email.com",
      ipAddress: "192.168.1.100",
      userAgent: "Chrome 125.0.0.0",
    },
    {
      id: "4",
      action: "view",
      document: "Contrato_Arrendamiento.pdf",
      user: "Ana García",
      timestamp: new Date("2024-06-01T15:22:00"),
      details: "Documento visualizado desde enlace compartido",
      ipAddress: "203.0.113.45",
      userAgent: "Safari 17.4.1",
    },
    {
      id: "5",
      action: "download",
      document: "Pasaporte.jpg",
      user: "Usuario Safedocs",
      timestamp: new Date("2024-06-01T16:45:00"),
      details: "Descarga autorizada del documento",
      ipAddress: "192.168.1.100",
      userAgent: "Chrome 125.0.0.0",
    },
    {
      id: "6",
      action: "verify",
      document: "Título_Propiedad.pdf",
      user: "Sistema",
      timestamp: new Date("2024-06-01T18:00:00"),
      details: "Verificación programada - Se detectaron modificaciones",
      ipAddress: "Sistema",
      userAgent: "Sistema",
    },
  ]

  const getActionIcon = (action: string) => {
    switch (action) {
      case "upload":
        return <Upload className="h-4 w-4 text-blue-500" />
      case "download":
        return <Download className="h-4 w-4 text-green-500" />
      case "share":
        return <Share2 className="h-4 w-4 text-purple-500" />
      case "verify":
        return <Shield className="h-4 w-4 text-orange-500" />
      case "view":
        return <Eye className="h-4 w-4 text-gray-500" />
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActionBadge = (action: string) => {
    const variants = {
      upload: "bg-blue-100 text-blue-800",
      download: "bg-green-100 text-green-800",
      share: "bg-purple-100 text-purple-800",
      verify: "bg-orange-100 text-orange-800",
      view: "bg-gray-100 text-gray-800",
      delete: "bg-red-100 text-red-800",
    }

    const labels = {
      upload: "Subida",
      download: "Descarga",
      share: "Compartido",
      verify: "Verificación",
      view: "Visualización",
      delete: "Eliminación",
    }

    return <Badge className={variants[action as keyof typeof variants]}>{labels[action as keyof typeof labels]}</Badge>
  }

  const filteredEntries = historyEntries.filter((entry) => {
    const matchesSearch =
      entry.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = filterAction === "all" || entry.action === filterAction

    const matchesDate =
      filterDate === "all" ||
      (() => {
        const entryDate = entry.timestamp
        const now = new Date()

        switch (filterDate) {
          case "today":
            return entryDate.toDateString() === now.toDateString()
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return entryDate >= weekAgo
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return entryDate >= monthAgo
          default:
            return true
        }
      })()

    return matchesSearch && matchesAction && matchesDate
  })

  const actionCounts = historyEntries.reduce(
    (acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <>
      <DashboardTitle>Historial</DashboardTitle>

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Actividades</p>
                  <p className="text-2xl font-bold">{historyEntries.length}</p>
                </div>
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documentos Subidos</p>
                  <p className="text-2xl font-bold">{actionCounts.upload || 0}</p>
                </div>
                <Upload className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documentos Compartidos</p>
                  <p className="text-2xl font-bold">{actionCounts.share || 0}</p>
                </div>
                <Share2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verificaciones</p>
                  <p className="text-2xl font-bold">{actionCounts.verify || 0}</p>
                </div>
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en historial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="upload">Subidas</SelectItem>
                  <SelectItem value="download">Descargas</SelectItem>
                  <SelectItem value="share">Compartidos</SelectItem>
                  <SelectItem value="verify">Verificaciones</SelectItem>
                  <SelectItem value="view">Visualizaciones</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* History Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Actividades</CardTitle>
            <CardDescription>
              {filteredEntries.length} de {historyEntries.length} actividades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">{getActionIcon(entry.action)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.document}</p>
                          {getActionBadge(entry.action)}
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.details}</p>
                      </div>

                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.user}
                      </div>
                      {entry.ipAddress !== "Sistema" && (
                        <>
                          <span>•</span>
                          <span>IP: {entry.ipAddress}</span>
                          <span>•</span>
                          <span>{entry.userAgent}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No se encontraron actividades con los filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
