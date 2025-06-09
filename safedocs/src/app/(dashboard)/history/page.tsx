"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
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
  Edit,
  Save,
  X,
} from "lucide-react" 
import { supabase } from "@/lib/supabase"
import Loading from "@/components/ui/Loading"
import { UploadDocumentDialog } from "@/modals/UploadDocumentDialog"

interface Document {
  id: string
  title: string
  description: string | null
  doc_type: string | null
  mime_type: string
  file_size: number
  created_at: string
  updated_at: string
}

interface HistoryEntry {
  id: number
  action: "upload" | "download" | "share" | "verify" | "view" | "delete"
  document_id: string | null
  user_id: string | null
  details: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterDate, setFilterDate] = useState("all")
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [editingDoc, setEditingDoc] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      
      
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
        return
      }

    
      const { data: historyData, error: historyError } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (historyError) {
        console.error('Error fetching history:', historyError)
        return
      }

      setHistoryEntries(historyData || [])
      setDocuments(documentsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el documento "${documentTitle}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('owner_id', user?.id)

      if (error) {
        alert('Error al eliminar el documento: ' + error.message)
        return
      }

      alert('Documento eliminado exitosamente')
      await fetchData() 
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error al eliminar el documento')
    }
  }

  const handleEditDocument = async (documentId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      alert('El título no puede estar vacío')
      return
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          title: newTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('owner_id', user?.id)

      if (error) {
        alert('Error al actualizar el documento: ' + error.message)
        return
      }

      alert('Documento actualizado exitosamente')
      setEditingDoc(null)
      setEditTitle("")
      await fetchData() 
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Error al actualizar el documento')
    }
  }

  const startEdit = (doc: Document) => {
    setEditingDoc(doc.id)
    setEditTitle(doc.title)
  }

  const cancelEdit = () => {
    setEditingDoc(null)
    setEditTitle("")
  }


  if (loading || loadingData) return <Loading title="Verificar Documentos"/>

  if (!user) {
    return null
  }

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
    const document = documents.find(doc => doc.id === entry.document_id)
    const documentTitle = document?.title || "Documento eliminado"
    const details = entry.details || ""

    const matchesSearch =
      documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = filterAction === "all" || entry.action === filterAction

    const matchesDate =
      filterDate === "all" ||
      (() => {
        const entryDate = new Date(entry.created_at)
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
        {/* Header with upload button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Mis Documentos y Actividades</h2>
          <UploadDocumentDialog />
        </div>

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

        {/* Documents Management */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Documentos</CardTitle>
            <CardDescription>
              {documents.length} documentos en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    {editingDoc === doc.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1"
                          placeholder="Título del documento"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditDocument(doc.id, editTitle)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.doc_type} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {editingDoc !== doc.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No tienes documentos subidos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
              {filteredEntries.map((entry) => {
                const document = documents.find(doc => doc.id === entry.document_id)
                return (
                  <div key={entry.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">{getActionIcon(entry.action)}</div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {document?.title || "Documento eliminado"}
                            </p>
                            {getActionBadge(entry.action)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.details || "Sin detalles"}
                          </p>
                        </div>

                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Usuario
                        </div>
                        {entry.ip_address && (
                          <>
                            <span>•</span>
                            <span>IP: {entry.ip_address}</span>
                          </>
                        )}
                        {entry.user_agent && (
                          <>
                            <span>•</span>
                            <span>{entry.user_agent}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

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