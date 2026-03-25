"use client";

import { useState, useEffect } from "react";
import { Search, Download, Bot, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface MarketplaceItem {
  id: string;
  type: "agent" | "squad";
  category: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  installs: number;
  price: number;
  agentConfig?: Record<string, unknown>;
  squadConfig?: Record<string, unknown>;
}

interface Squad { id: string; name: string; icon: string | null; agentCount: number; }

const CATEGORIES = ["marketing", "content", "design", "analytics", "development", "support", "sales", "general"];

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [filter, setFilter] = useState<"all" | "agent" | "squad">("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [acquireItem, setAcquireItem] = useState<MarketplaceItem | null>(null);
  const [selectedSquadId, setSelectedSquadId] = useState("");
  const [acquiring, setAcquiring] = useState(false);

  useEffect(() => {
    fetch("/api/marketplace").then((r) => r.json()).then(setItems);
    fetch("/api/squads").then((r) => r.json()).then(setSquads);
  }, []);

  const filtered = items.filter((i) => {
    if (filter !== "all" && i.type !== filter) return false;
    if (category !== "all" && i.category !== category) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleAcquire() {
    if (!acquireItem) return;
    setAcquiring(true);

    const body = acquireItem.type === "agent" ? { squadId: selectedSquadId } : {};
    const res = await fetch(`/api/marketplace/${acquireItem.id}/acquire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      setAcquireItem(null);
      // Refresh
      fetch("/api/marketplace").then((r) => r.json()).then(setItems);
      fetch("/api/squads").then((r) => r.json()).then(setSquads);
      if (data.squadId) window.location.href = `/squads/${data.squadId}`;
    }
    setAcquiring(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Agentes e squads prontos para usar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["all", "agent", "squad"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f === "all" ? "Todos" : f === "agent" ? "Agentes" : "Squads"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={category === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setCategory("all")}>Todos</Badge>
        {CATEGORIES.map((c) => (
          <Badge key={c} variant={category === c ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => setCategory(c)}>{c}</Badge>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <CardTitle className="text-sm">{item.name}</CardTitle>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-[10px]">{item.type === "agent" ? "Agente" : "Squad"}</Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{item.category}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <p className="text-xs text-muted-foreground flex-1">{item.description}</p>
              {item.type === "squad" && item.squadConfig && (
                <p className="text-[10px] text-muted-foreground">
                  {((item.squadConfig as Record<string, unknown>).agents as unknown[])?.length ?? 0} agentes
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Download className="h-3 w-3" /> {item.installs}
                </span>
                <Button size="sm" className="text-xs" onClick={() => { setAcquireItem(item); if (item.type === "agent" && squads.length > 0) setSelectedSquadId(squads[0]!.id); }}>
                  Adquirir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum item encontrado</div>
        )}
      </div>

      {/* Acquire Dialog */}
      <Dialog open={!!acquireItem} onOpenChange={(open) => { if (!open) setAcquireItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{acquireItem?.icon} {acquireItem?.name}</DialogTitle>
            <DialogDescription>{acquireItem?.description}</DialogDescription>
          </DialogHeader>
          {acquireItem?.type === "agent" && (
            <div className="space-y-2 py-4">
              <p className="text-sm">Em qual squad adicionar?</p>
              <Select value={selectedSquadId} onValueChange={(v) => { if (v) setSelectedSquadId(v); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o squad" /></SelectTrigger>
                <SelectContent>
                  {squads.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name} ({s.agentCount} agentes)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {acquireItem?.type === "squad" && (
            <p className="text-sm py-4">Um novo squad será criado na sua organização com todos os agentes e pipeline configurados.</p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAcquireItem(null)}>Cancelar</Button>
            <Button onClick={handleAcquire} disabled={acquiring || (acquireItem?.type === "agent" && !selectedSquadId)}>
              {acquiring ? "Adquirindo..." : "Adquirir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
