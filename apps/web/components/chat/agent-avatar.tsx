"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AgentAvatarProps {
  icon: string;
  name: string;
  role?: string;
  status?: "idle" | "working" | "paused";
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-7 w-7 text-sm",
  md: "h-9 w-9 text-lg",
  lg: "h-12 w-12 text-xl",
};

export function AgentAvatar({ icon, name, role, status, size = "md" }: AgentAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="relative shrink-0">
          <div className={`flex items-center justify-center rounded-full bg-muted ${SIZES[size]}`}>
            {icon}
          </div>
          {status === "working" && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-blue-500 animate-pulse" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{name}</p>
        {role && <p className="text-xs text-muted-foreground">{role}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
