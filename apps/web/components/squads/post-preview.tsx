"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Instagram, Linkedin, Heart, MessageCircle, Send, Bookmark, ThumbsUp, Repeat2 } from "lucide-react";

interface PostPreviewProps {
  content: string;
  agentName: string;
  agentIcon: string;
}

export function PostPreview({ content, agentName, agentIcon }: PostPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [platform, setPlatform] = useState<"instagram" | "linkedin">("instagram");

  const postText = extractPostText(content);

  return (
    <div className="mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="gap-1.5 text-xs"
      >
        <Eye className="h-3.5 w-3.5" />
        {expanded ? "Ocultar prévia" : "Ver prévia do post"}
      </Button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Platform tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setPlatform("instagram")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                platform === "instagram" ? "bg-pink-500/15 text-pink-400 border border-pink-500/30" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Instagram className="h-3 w-3" />
              Instagram
            </button>
            <button
              onClick={() => setPlatform("linkedin")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                platform === "linkedin" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </button>
          </div>

          {/* Preview card */}
          {platform === "instagram" ? (
            <InstagramPreview text={postText} agentName={agentName} agentIcon={agentIcon} />
          ) : (
            <LinkedInPreview text={postText} agentName={agentName} agentIcon={agentIcon} />
          )}
        </div>
      )}
    </div>
  );
}

function InstagramPreview({ text, agentName, agentIcon }: { text: string; agentName: string; agentIcon: string }) {
  const lines = text.split("\n").filter(l => l.trim());
  const caption = lines.join("\n");
  const hashtags = caption.match(/#\w+/g) ?? [];

  return (
    <div className="max-w-sm rounded-lg border border-border bg-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center text-sm">
          {agentIcon}
        </div>
        <span className="text-xs font-semibold">orbitmind360</span>
      </div>
      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-purple-900/50 via-indigo-900/30 to-blue-900/50 flex items-center justify-center">
        <span className="text-4xl opacity-30">📸</span>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 cursor-pointer hover:text-red-400 transition-colors" />
          <MessageCircle className="h-5 w-5 cursor-pointer" />
          <Send className="h-5 w-5 cursor-pointer" />
        </div>
        <Bookmark className="h-5 w-5 cursor-pointer" />
      </div>
      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-xs leading-relaxed">
          <span className="font-semibold mr-1">orbitmind360</span>
          {caption.substring(0, 300)}
          {caption.length > 300 && <span className="text-muted-foreground">... mais</span>}
        </p>
        {hashtags.length > 0 && (
          <p className="text-xs text-blue-400 mt-1">{hashtags.slice(0, 10).join(" ")}</p>
        )}
      </div>
    </div>
  );
}

function LinkedInPreview({ text, agentName, agentIcon }: { text: string; agentName: string; agentIcon: string }) {
  return (
    <div className="max-w-md rounded-lg border border-border bg-[#1b1f23] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-lg">
          {agentIcon}
        </div>
        <div>
          <p className="text-sm font-semibold">OrbitMind360</p>
          <p className="text-[10px] text-muted-foreground">Agente: {agentName} · Agora</p>
        </div>
      </div>
      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {text.substring(0, 500)}
          {text.length > 500 && <span className="text-blue-400 cursor-pointer">...ver mais</span>}
        </p>
      </div>
      {/* Engagement bar */}
      <div className="border-t border-border/50 px-4 py-1">
        <p className="text-[10px] text-muted-foreground">0 reações · 0 comentários</p>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-around border-t border-border/50 py-2 text-xs text-muted-foreground">
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ThumbsUp className="h-4 w-4" /> Gostei
        </button>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" /> Comentar
        </button>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Repeat2 className="h-4 w-4" /> Compartilhar
        </button>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Send className="h-4 w-4" /> Enviar
        </button>
      </div>
    </div>
  );
}

/**
 * Extract actual post text from agent output.
 * Tries specific patterns first, falls back to a cleaned version of the content.
 */
function extractPostText(content: string): string {
  // Try to find a "post" or "legenda" section
  const patterns = [
    /(?:## (?:Post|Legenda|Caption|Texto do post|Conteúdo do post|Texto principal)[^\n]*\n)([\s\S]+?)(?=\n## |\n---|\n#|$)/i,
    /(?:### (?:Post|Legenda|Caption|Texto|Versão|Frase)[^\n]*\n)([\s\S]+?)(?=\n### |\n---|\n#|$)/i,
    /(?:Legenda|Caption|Post|Texto):\s*\n([\s\S]+?)(?=\n## |\n---|\n#|$)/i,
    /(?:""")([\s\S]+?)(?:""")/,
    /(?:")([\s\S]{50,}?)(?:")/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }

  // Fallback: use the content itself, stripped of markdown headers
  const cleaned = content
    .replace(/^#{1,4}\s+.+$/gm, "")
    .replace(/^---$/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.substring(0, 600);
}
