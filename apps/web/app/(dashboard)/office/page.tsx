"use client";

import dynamic from "next/dynamic";

const VirtualOffice = dynamic(() => import("@/components/office/virtual-office"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#f2541b] border-t-transparent" />
        <p className="text-sm text-muted-foreground">Abrindo o escritório…</p>
      </div>
    </div>
  ),
});

export default function OfficePage() {
  return (
    <div className="-m-6 h-[100dvh] overflow-hidden">
      <VirtualOffice />
    </div>
  );
}
