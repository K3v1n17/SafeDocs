import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Sliderbar/app-sidebar"
import { DashboardTitle } from "@/components/Sliderbar/DashboardTitle"
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        {children}
      </main>
    </SidebarProvider>
  )
}