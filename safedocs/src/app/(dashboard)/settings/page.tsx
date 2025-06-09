"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
import { Button } from "@/components/ui/button"
import { useSettingsState } from "../../../hooks/useSettingsState"
import { ProfileSettings } from "../../../components/settings/ProfileSettings"
import { SecuritySettings } from "../../../components/settings/SecuritySettings"
import { PreferencesSettings } from "../../../components/settings/PreferencesSettings"
import { DataManagementSettings } from "../../../components/settings/DataManagementSettings"
import { DangerZoneSettings } from "../../../components/settings/DangerZoneSettings"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const {
    profile,
    security,
    preferences,
    handleProfileChange,
    handleSecurityChange,
    handlePreferencesChange,
  } = useSettingsState()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  const handleSaveChanges = () => {
    // Implementar la lógica para guardar los cambios
    console.log("Guardando cambios", { profile, security, preferences })
  }

  if (loading || !user) {
    return null
  }

  return (
    <>
      <DashboardTitle>Configuración</DashboardTitle>

      <div className="flex-1 space-y-6 p-6">
        <ProfileSettings profile={profile} onProfileChange={handleProfileChange} />

        <SecuritySettings security={security} onSecurityChange={handleSecurityChange} />

        <PreferencesSettings preferences={preferences} onPreferencesChange={handlePreferencesChange} />

        <DataManagementSettings />

        <DangerZoneSettings />

        {/* Save Button */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancelar</Button>
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </div>
      </div>
    </>
  )
}
