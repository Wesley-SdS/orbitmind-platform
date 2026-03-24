"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Bot,
  Users,
  Link2,
  Settings,
  Building2,
  Orbit,
  KanbanSquare,
  ShoppingBag,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    orgId: string;
    role: string;
  };
}

const navItems = [
  { title: "Chat", href: "/chat", icon: MessageSquare, id: "sidebar-chat" },
  { title: "Board", href: "/board", icon: KanbanSquare, id: "sidebar-board" },
  { title: "Squads", href: "/squads", icon: Bot, id: "sidebar-squads" },
  { title: "Agentes", href: "/agents", icon: Users, id: "sidebar-agents" },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag, id: "sidebar-marketplace" },
  { title: "Integracoes", href: "/integrations", icon: Link2, id: "sidebar-integrations" },
  { title: "Settings", href: "/settings", icon: Settings, id: "sidebar-settings" },
  { title: "Escritorio", href: "/office", icon: Building2, id: "sidebar-office", badge: undefined as string | undefined },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Orbit className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">OrbitMind</span>
            <span className="text-xs text-muted-foreground">Platform</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href} id={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Plano Free</span>
            <span className="text-muted-foreground">3/100 execucoes</span>
          </div>
          <Progress value={3} className="h-1.5" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
