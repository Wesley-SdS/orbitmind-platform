"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentAvatar } from "./agent-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2, Copy, RotateCcw } from "lucide-react";
import type { ChatMessage } from "@orbitmind/shared";
import { AngleSelector } from "./angle-selector";
import { ToneSelector } from "./tone-selector";

interface MessageBubbleProps {
  message: ChatMessage;
  agent?: { name: string; icon: string; role: string } | null;
  onAction?: (content: string) => void;
}

export function MessageBubble({ message, agent, onAction }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.role === "system") {
    return <SystemMessage message={message} onAction={onAction} />;
  }

  const isUser = message.role === "user";
  const meta = message.metadata as Record<string, unknown> | null;
  const isArchitect = !!meta?.isArchitect;

  // Check if this is a design proposal (contains approval question)
  const hasDesignProposal =
    isArchitect &&
    !isUser &&
    (message.content.includes("criar agora") ||
      message.content.includes("ajustar") ||
      message.content.includes("O que acha"));

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          Eu
        </div>
      ) : agent ? (
        <AgentAvatar icon={agent.icon} name={agent.name} role={agent.role} status="idle" />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
      )}
      <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? "items-end" : ""}`}>
        {!isUser && agent && (
          <span className="text-xs font-medium text-muted-foreground">{agent.name}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <pre className="my-2 overflow-auto rounded-lg bg-background/50 p-3 text-xs">
                      <code>{children}</code>
                    </pre>
                  );
                }
                return (
                  <code className="rounded bg-background/50 px-1 py-0.5 text-xs font-mono">
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {/* Action buttons for design proposals */}
        {hasDesignProposal && onAction && (
          <div className="flex gap-2 mt-1">
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => onAction("Criar agora")}>
              <Check className="h-3 w-3" />
              Criar
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onAction("Quero ajustar")}>
              <Edit2 className="h-3 w-3" />
              Ajustar
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => onAction("Cancelar")}>
              <X className="h-3 w-3" />
              Cancelar
            </Button>
          </div>
        )}
        {/* Copy / Resend for user messages */}
        {isUser && onAction && (
          <div className="flex gap-1 mt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => navigator.clipboard.writeText(message.content)}
              title="Copiar"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onAction(message.content)}
              title="Reenviar"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        )}
        <span className="text-[10px] text-muted-foreground">{time}</span>
      </div>
    </div>
  );
}

function SystemMessage({ message, onAction }: { message: ChatMessage; onAction?: (content: string) => void }) {
  const meta = message.metadata as Record<string, unknown> | null;
  const msgType = meta?.type as string | undefined;
  const isCheckpoint = msgType === "checkpoint";

  // Angle selection
  if (msgType === "angle-selection" && meta?.angles && onAction) {
    return (
      <div className="py-2 max-w-lg mx-auto">
        <AngleSelector angles={meta.angles as Array<{ emoji: string; name: string; hook: string; description: string }>} onSelect={onAction} />
      </div>
    );
  }

  // Tone selection
  if (msgType === "tone-selection" && meta?.tones && onAction) {
    return (
      <div className="py-2 max-w-lg mx-auto">
        <ToneSelector tones={meta.tones as Array<{ id: string; name: string; emoji: string; description: string; example: string }>} onSelect={onAction} />
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <div className="flex flex-col items-center gap-2">
        <Badge variant="outline" className="gap-1.5 text-xs">
          {isCheckpoint ? "⏸️" : "🔔"} {message.content}
        </Badge>
        {isCheckpoint && onAction && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onAction("Aprovar")}>
              <Check className="h-3 w-3" />
              Aprovar
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onAction("Editar")}>
              <Edit2 className="h-3 w-3" />
              Editar
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => onAction("Rejeitar")}>
              <X className="h-3 w-3" />
              Rejeitar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
