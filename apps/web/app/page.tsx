import type { Metadata } from "next";
import { LandingPage } from "@/components/landing";

export const metadata: Metadata = {
  title: "OrbitMind — Software house e consultoria em IA",
  description:
    "Plataformas, apps e agentes de IA sob medida. Contrate um time de desenvolvimento contínuo ou um projeto com escopo fechado — e conheça a OrbitMind Platform.",
};

export default function HomePage() {
  return <LandingPage />;
}
