import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";

const MOCK_USER = {
  id: "u-1",
  name: "Admin OrbitMind",
  email: "admin@orbitmind.com",
  orgId: "org-1",
  role: "owner",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: trocar por auth() quando DB estiver rodando
  const user = MOCK_USER;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex flex-1 flex-col">
          <TopBar user={user} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
