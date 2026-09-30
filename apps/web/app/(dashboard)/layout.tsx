import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { auth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { countQuoteRequestsByStatus } from "@/lib/db/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const quotes = isPlatformAdmin(session?.user?.email)
    ? {
        newCount:
          (await countQuoteRequestsByStatus()).find((row) => row.status === "new")?.total ?? 0,
      }
    : null;

  return (
    <SidebarProvider>
      <OnboardingProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar quotes={quotes} />
          <div className="flex flex-1 flex-col min-w-0">
            <TopBar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </OnboardingProvider>
    </SidebarProvider>
  );
}
