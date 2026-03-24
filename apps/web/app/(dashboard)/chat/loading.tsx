import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)]">
      <div className="w-72 shrink-0 border-r border-border/50 bg-muted/30 p-4 space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-16 w-16 rounded-2xl" />
      </div>
    </div>
  );
}
