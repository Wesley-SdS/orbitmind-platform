"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    setIsExpanded(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, onSend]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && isExpanded) {
      setIsExpanded(false);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleModalInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
  }

  function openExpanded() {
    setIsExpanded(true);
    setTimeout(() => modalTextareaRef.current?.focus(), 50);
  }

  return (
    <>
      <div className="border-t border-border/50 bg-background p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" disabled>
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Envie uma mensagem..."
              className="min-h-[52px] max-h-[200px] resize-y pr-9"
              rows={2}
              disabled={disabled}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 opacity-50 hover:opacity-100"
              onClick={openExpanded}
              title="Expandir editor"
              type="button"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-4xl flex-col gap-3 rounded-xl border border-border bg-background p-6 shadow-2xl" style={{ height: "80vh" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Editor expandido</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              ref={modalTextareaRef}
              value={value}
              onChange={handleModalInput}
              onKeyDown={handleKeyDown}
              placeholder="Escreva seu prompt completo..."
              className="flex-1 min-h-0 resize-none"
              rows={12}
              disabled={disabled}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsExpanded(false)}>
                Voltar
              </Button>
              <Button size="sm" onClick={handleSend} disabled={!value.trim() || disabled}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
