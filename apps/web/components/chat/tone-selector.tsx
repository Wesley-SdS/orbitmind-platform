"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ToneOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  example: string;
}

interface ToneSelectorProps {
  tones: ToneOption[];
  onSelect: (content: string) => void;
}

export function ToneSelector({ tones, onSelect }: ToneSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Escolha o tom de voz:</p>
      <div className="grid grid-cols-2 gap-2">
        {tones.map((tone) => (
          <button
            key={tone.id}
            onClick={() => onSelect(`Tom: ${tone.name}`)}
            className="text-left"
          >
            <Card className="h-full transition-colors hover:border-primary/50 cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{tone.emoji}</span>
                  <span className="text-sm font-medium">{tone.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{tone.description}</p>
                <p className="text-xs text-primary/70 mt-1.5 italic line-clamp-2">"{tone.example}"</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
