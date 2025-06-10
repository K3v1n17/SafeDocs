"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Loading from "@/components/ui/Loading"
import { UploadDocumentDialog } from "@/modals/UploadDocumentDialog"

// Componentes
import { StatsCards } from "@/components/History/StatsCards"
import { DocumentCard } from "@/components/History/DocumentCard"
import { DocumentFilters } from "@/components/History/DocumentFilters"
import { ActivityHistory } from "@/components/History/ActivityHistory"

interface Document {
  id: string
  title: string
  description: string | null
  doc_type: string | null
  tags: string[]
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

interface EditingDocument {
  title: string
  description: string
  doc_type: string
  tags: string[]
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
  const [editingData, setEditingData] = useState<EditingDocument>({
    title: "",
    description: "",
    doc_type: "",
    tags: [],
  })
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const documentTypes = [
    "Cédula de Identidad",
    "Pasaporte",
    "Título de Propiedad",
    "Escritura Notarial",
    "Contrato",
    "Certificado",
    "Otro",
  ]

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
        .from("documents")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false })

      if (documentsError) {
        console.error("Error fetching documents:", documentsError)
        return
      }

      const { data: historyData, error: historyError } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (historyError) {
        console.error("Error fetching history:", historyError)
        return
      }

      setHistoryEntries(historyData || [])
      setDocuments(documentsData || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el documento "${documentTitle}"?`)) {
      return
    }

    try {
      const { error } = await supabase.from("documents").delete().eq("id", documentId).eq("owner_id", user?.id)

      if (error) {
        alert("Error al eliminar el documento: " + error.message)
        return
      }

      alert("Documento eliminado exitosamente")
      await fetchData()
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Error al eliminar el documento")
    }
  }

  const handleEditDocument = async (documentId: string) => {
    if (!editingData.title.trim()) {
      alert("El título no puede estar vacío")
      return
    }

    try {
      const { error } = await supabase
        .from("documents")
        .update({
          title: editingData.title.trim(),
          description: editingData.description.trim() || null,
          doc_type: editingData.doc_type || null,
          tags: editingData.tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .eq("owner_id", user?.id)

      if (error) {
        alert("Error al actualizar el documento: " + error.message)
        return
      }

      alert("Documento actualizado exitosamente")
      setEditingDoc(null)
      setEditingData({ title: "", description: "", doc_type: "", tags: [] })
      await fetchData()
    } catch (error) {
      console.error("Error updating document:", error)
      alert("Error al actualizar el documento")
    }
  }

  const startEdit = (doc: Document) => {
    setEditingDoc(doc.id)
    setEditingData({
      title: doc.title,
      description: doc.description || "",
      doc_type: doc.doc_type || "",
      tags: doc.tags || [],
    })
  }

  const cancelEdit = () => {
    setEditingDoc(null)
    setEditingData({ title: "", description: "", doc_type: "", tags: [] })
    setExpandedDoc(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getMimeTypeIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄"
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊"
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📈"
    if (mimeType.includes("image")) return "🖼️"
    if (mimeType.includes("video")) return "🎥"
    if (mimeType.includes("audio")) return "🎵"
    return "📁"
  }

  if (loading || loadingData) return <Loading title="Verificar Documentos" />

  if (!user) {
    return null
  }

  const filteredEntries = historyEntries.filter((entry) => {
    const document = documents.find((doc) => doc.id === entry.document_id)
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
    <div className="min-h-screen bg-white">
      <DashboardTitle>Historial</DashboardTitle>

      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Mis Documentos y Actividades</h2>
            <p className="text-gray-600 mt-2">Gestiona y revisa toda tu actividad documental</p>
          </div>
          <UploadDocumentDialog />
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalActivities={historyEntries.length}
          totalDocuments={documents.length}
          sharedDocuments={actionCounts.share || 0}
          verifications={actionCounts.verify || 0}
        />

        {/* Documents Management */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Documentos</CardTitle>
            <CardDescription>{documents.length} documentos en total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isExpanded={expandedDoc === doc.id}
                  isEditing={editingDoc === doc.id}
                  editingData={editingData}
                  documentTypes={documentTypes}
                  onToggleExpand={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                  onStartEdit={() => startEdit(doc)}
                  onSaveEdit={() => handleEditDocument(doc.id)}
                  onCancelEdit={cancelEdit}
                  onDelete={() => handleDeleteDocument(doc.id, doc.title)}
                  setEditingData={setEditingData}
                  formatFileSize={formatFileSize}
                  getMimeTypeIcon={getMimeTypeIcon}
                />
              ))}

              {documents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No tienes documentos subidos</h3>
                  <p className="text-sm">Sube tu primer documento para comenzar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <DocumentFilters
          searchTerm={searchTerm}
          filterAction={filterAction}
          filterDate={filterDate}
          onSearchChange={setSearchTerm}
          onActionChange={setFilterAction}
          onDateChange={setFilterDate}
        />

        {/* Activity History */}
        <ActivityHistory entries={filteredEntries} documents={documents} totalEntries={historyEntries.length} />
      </div>
    </div>
  )
}
