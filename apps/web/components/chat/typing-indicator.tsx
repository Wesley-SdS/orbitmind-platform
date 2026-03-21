"use client";

import { AgentAvatar } from "./agent-avatar";

interface TypingIndicatorProps {
  agentName: string;
  agentIcon: string;
}

export function TypingIndicator({ agentName, agentIcon }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <AgentAvatar icon={agentIcon} name={agentName} status="working" size="sm" />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-muted-foreground">{agentName} esta digitando...</span>
    </div>
  );
}
