import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getSessionUser() {
  const session = await getRequiredSession();
  return {
    userId: session.user.id,
    orgId: session.user.orgId,
    role: session.user.role,
  };
}
