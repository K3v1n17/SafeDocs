"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Share2, Shield, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [documentCount, setDocumentCount] = useState(0)
  const [sharedCount, setSharedCount] = useState(0)
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [authorizedUsers, setAuthorizedUsers] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

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
    }

    fetchStats()
  }, [user])

  if (loading || !user) return null

  const stats = [
    {
      title: "Documentos Subidos",
      value: documentCount.toString(),
      description: "Total de documentos",
      icon: FileText,
      trend: "+12% desde el mes pasado",
    },
    {
      title: "Documentos Compartidos",
      value: sharedCount.toString(),
      description: "Enlaces activos",
      icon: Share2,
      trend: "+3 esta semana",
    },
    {
      title: "Verificaciones",
      value: verifiedCount.toString(),
      description: "Documentos verificados",
      icon: Shield,
      trend: "+23% este mes",
    },
    {
      title: "Usuarios Autorizados",
      value: authorizedUsers.toString(),
      description: "Acceso concedido",
      icon: Users,
      trend: "+2 nuevos",
    },
  ]

  const recentActivity = [
    {
      action: "Documento verificado",
      document: "Cédula de Identidad",
      time: "Hace 2 horas",
      status: "success",
    },
    {
      action: "Documento compartido",
      document: "Título de Propiedad",
      time: "Hace 4 horas",
      status: "info",
    },
    {
      action: "Nuevo documento subido",
      document: "Pasaporte",
      time: "Hace 1 día",
      status: "success",
    },
    {
      action: "Acceso autorizado",
      document: "Escritura Notarial",
      time: "Hace 2 días",
      status: "warning",
    },
  ]

  return (
    <>
      <DashboardTitle>Overview</DashboardTitle>

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Uso de Almacenamiento</CardTitle>
              <CardDescription>Espacio utilizado en tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Documentos</span>
                  <span>2.4 GB / 10 GB</span>
                </div>
                <Progress value={24} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">Tienes 7.6 GB disponibles</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Tareas frecuentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Subir Nuevo Documento
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Compartir Documento
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Verificar Integridad
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "info"
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.document}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
