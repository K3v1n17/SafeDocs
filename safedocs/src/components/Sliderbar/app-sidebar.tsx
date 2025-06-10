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
import { useAuth } from "@/contexts/AuthContext"

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

const teams = [
  {
    name: "Safedocs Inc",
    logo: ShieldCheck,
    plan: "Enterprise",
  },
];

const navMain = [
  {
    title: "Dashboard",
    url: "/overview",
    icon: AudioWaveform,
    isActive: true,
  },
  {
    title: "Mi Almacen",
    url: "/history",
    icon: BookOpen,
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Get user display name from metadata or email
  const userName = user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   "Usuario Safedocs";
  
  // Create user data object with actual user information
  const userData = {
    name: userName,
    email: user?.email || "usuario@safedocs.com",
    avatar: user?.user_metadata?.avatar_url || "/avatars/default-avatar.png",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
