import { cache } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const getRequiredSession = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
});

export const getSessionUser = cache(async () => {
  const session = await getRequiredSession();
  return {
    userId: session.user.id,
    orgId: session.user.orgId,
    role: session.user.role,
  };
});
