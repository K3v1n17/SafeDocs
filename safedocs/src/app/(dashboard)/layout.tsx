import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Sliderbar/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}