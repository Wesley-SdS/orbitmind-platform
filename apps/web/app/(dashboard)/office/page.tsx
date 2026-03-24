"use client";

import dynamic from "next/dynamic";

const VirtualOffice = dynamic(
  () => import("@/components/office/virtual-office"),
  { ssr: false, loading: () => (
    <div className="flex h-96 items-center justify-center">
      <p className="text-sm text-muted-foreground">Carregando escritorio virtual...</p>
    </div>
  )}
);

export default function OfficePage() {
  return <VirtualOffice />;
}
