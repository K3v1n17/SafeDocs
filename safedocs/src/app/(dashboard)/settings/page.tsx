"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  User,
  Shield,
  Key,
  Trash2,
  Download,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Lock,
  AlertTriangle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState({
    name: "Usuario Safedocs",
    email: "usuario@safedocs.com",
    phone: "+1 234 567 8900",
    company: "Safedocs Inc",
    bio: "Administrador de documentos seguros",
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    autoLogout: "30",
    encryptionLevel: "aes256",
  })

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "es",
    timezone: "America/Mexico_City",
    dateFormat: "dd/mm/yyyy",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return (
    <>
      <DashboardTitle>Configuración</DashboardTitle>

      <div className="flex-1 space-y-6 p-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil de Usuario
            </CardTitle>
            <CardDescription>Información personal y datos de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/avatars/default-avatar.png" />
                <AvatarFallback>US</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline">Cambiar Foto</Button>
                <p className="text-sm text-muted-foreground">JPG, PNG hasta 2MB</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Configuración de seguridad y autenticación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Autenticación de Dos Factores</Label>
                <p className="text-sm text-muted-foreground">
                  Protege tu cuenta con un segundo factor de autenticación
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={security.twoFactorEnabled}
                  onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                />
                {security.twoFactorEnabled && <Badge className="bg-green-100 text-green-800">Activo</Badge>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">Recibe alertas de seguridad por correo</p>
                </div>
                <Switch
                  checked={security.emailNotifications}
                  onCheckedChange={(checked) => setSecurity({ ...security, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificaciones por SMS</Label>
                  <p className="text-sm text-muted-foreground">Recibe alertas críticas por mensaje de texto</p>
                </div>
                <Switch
                  checked={security.smsNotifications}
                  onCheckedChange={(checked) => setSecurity({ ...security, smsNotifications: checked })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cierre de Sesión Automático</Label>
                <Select
                  value={security.autoLogout}
                  onValueChange={(value) => setSecurity({ ...security, autoLogout: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nivel de Encriptación</Label>
                <Select
                  value={security.encryptionLevel}
                  onValueChange={(value) => setSecurity({ ...security, encryptionLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aes128">AES-128</SelectItem>
                    <SelectItem value="aes256">AES-256</SelectItem>
                    <SelectItem value="rsa2048">RSA-2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Key className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Smartphone className="mr-2 h-4 w-4" />
                Configurar Autenticador
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Descargar Códigos de Respaldo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferencias
            </CardTitle>
            <CardDescription>Personaliza tu experiencia en Safedocs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Oscuro
                      </div>
                    </SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zona Horaria</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
                    <SelectItem value="America/New_York">Nueva York</SelectItem>
                    <SelectItem value="Europe/Madrid">Madrid</SelectItem>
                    <SelectItem value="America/Buenos_Aires">Buenos Aires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Formato de Fecha</Label>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Gestión de Datos
            </CardTitle>
            <CardDescription>Exporta o elimina tus datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Exportar Todos los Documentos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Descargar Historial de Actividad
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Solicitar Copia de Datos Personales
              </Button>
            </div>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Todos los datos exportados están encriptados y requieren tu contraseña para acceder.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Zona de Peligro
            </CardTitle>
            <CardDescription>Acciones irreversibles que afectan tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Todos los Documentos
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Cerrar Cuenta Permanentemente
              </Button>
            </div>

            <Alert className="border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                Estas acciones no se pueden deshacer. Todos tus documentos y datos se eliminarán permanentemente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancelar</Button>
          <Button>Guardar Cambios</Button>
        </div>
      </div>
    </>
  )
}
