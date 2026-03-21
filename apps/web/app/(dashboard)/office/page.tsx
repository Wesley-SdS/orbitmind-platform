import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

export default function OfficePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Escritorio Virtual</h1>
        <p className="text-muted-foreground max-w-md">
          Acompanhe seus agentes em um escritorio virtual interativo estilo Gather. Veja handoffs acontecendo em tempo real.
        </p>
        <Badge variant="secondary">Em breve</Badge>
      </div>
    </div>
  );
}
