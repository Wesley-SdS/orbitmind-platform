"use client";

import dynamic from "next/dynamic";

const VirtualOffice3D = dynamic(
  () => import("@/components/office/virtual-office-3d"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0a0a1a]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Carregando escritorio 3D...</p>
        </div>
      </div>
    ),
  },
);

export default function OfficePage() {
  return (
    <div className="h-[calc(100vh-5rem)]">
      <VirtualOffice3D />
    </div>
  );
}
