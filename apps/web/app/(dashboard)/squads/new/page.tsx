import { redirect } from "next/navigation";

export default function NewSquadPage() {
  redirect("/chat?squad=system-architect");
}
