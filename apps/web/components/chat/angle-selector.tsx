"use client";

import { Card, CardContent } from "@/components/ui/card";

interface AngleOption {
  emoji: string;
  name: string;
  hook: string;
  description: string;
}

interface AngleSelectorProps {
  angles: AngleOption[];
  onSelect: (content: string) => void;
}

export function AngleSelector({ angles, onSelect }: AngleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Escolha o angulo para o conteudo:</p>
      <div className="grid gap-2">
        {angles.map((angle, i) => (
          <button
            key={i}
            onClick={() => onSelect(`Escolhi o angulo: ${angle.emoji} ${angle.name}`)}
            className="text-left"
          >
            <Card className="transition-colors hover:border-primary/50 cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{angle.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{angle.name}</p>
                    <p className="text-sm text-primary mt-0.5">"{angle.hook}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{angle.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
