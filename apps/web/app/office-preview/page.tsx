import { notFound } from "next/navigation";
import { OfficePreviewClient } from "./office-preview-client";

export const dynamic = "force-dynamic";

// QA visual do escritório com dados de exemplo. Existe em desenvolvimento ou com OFFICE_PREVIEW=1 (teste local de produção).
// ?view=main (padrão) reproduz a prancha 01; ?view=checkpoint, a prancha 02; ?rot=0..3 gira a câmera.
export default async function OfficePreviewPage({ searchParams }: { searchParams: Promise<{ view?: string; rot?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.OFFICE_PREVIEW !== "1") notFound();
  const { view, rot } = await searchParams;
  const rotation = Number(rot);
  return <OfficePreviewClient view={view === "checkpoint" ? "checkpoint" : "main"} rotation={Number.isInteger(rotation) && rotation >= 0 && rotation <= 3 ? rotation : null} />;
}
