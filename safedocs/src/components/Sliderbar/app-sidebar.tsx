"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  CheckSquare,
  CloudUpload,
  Link2,
  ShieldCheck,
  Settings2,
} from "lucide-react";

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Usuario Safedocs",
    email: "usuario@safedocs.com",
    avatar: "/avatars/default-avatar.png",
  },
  teams: [
    {
      name: "Safedocs Inc",
      logo: ShieldCheck,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/overview",
      icon: AudioWaveform,
      isActive: true,
    },
    {
      title: "Subir Documentos",
      url: "/upload",
      icon: CloudUpload,
    },
    {
      title: "Compartir Documentos",
      url: "/share",
      icon: Link2,
    },
    {
      title: "Verificar Documentos",
      url: "/verify",
      icon: CheckSquare,
    },
    {
      title: "Historial",
      url: "/history",
      icon: BookOpen,
    },
    {
      title: "Configuración",
      url: "/settings",
      icon: Settings2,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
