import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Sliderbar/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { ProtectedDashboard } from "@/components/ProtectedDashboard"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedDashboard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedDashboard>
  )
}