import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { getRequiredSession } from "@/lib/auth/session";
import { getOrganizationById } from "@/lib/db/queries/organizations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getRequiredSession();
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    orgId: session.user.orgId,
    role: session.user.role,
  };

  const org = await getOrganizationById(session.user.orgId);
  const showTour = !(org?.onboardingCompleted);

  return (
    <SidebarProvider>
      <OnboardingProvider showTour={showTour}>
        <div className="flex min-h-screen w-full">
          <AppSidebar user={user} />
          <div className="flex flex-1 flex-col">
            <TopBar user={user} />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </OnboardingProvider>
    </SidebarProvider>
  );
}
