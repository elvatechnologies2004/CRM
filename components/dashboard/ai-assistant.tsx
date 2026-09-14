"use client";

import * as React from "react";
import { Bot, Send, Sparkles, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiQuickActions } from "@/lib/mock-data";

function AIAssistant() {
  const [value, setValue] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const [reply, setReply] = React.useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const submit = (message?: string) => {
    const text = (message ?? value).trim();
    if (!text || isThinking) return;
    setReply(null);
    setIsThinking(true);
    timerRef.current = window.setTimeout(() => {
      setIsThinking(false);
      setReply(
        text
          ? `Got it — working on "${text}". I'll have a recommendation ready shortly.`
          : "Ask me anything about your leads, deals, pipeline or revenue."
      );
    }, 1100);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") submit();
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#EEF2FF] via-card to-[#F5F3FF] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-brand-purple/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-purple text-white shadow-sm">
              <Bot className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-ink">AI Assistant</h2>
          </span>
          <Badge className="border-transparent bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3" aria-hidden />
            Beta
          </Badge>
        </div>
        <p className="mt-3 text-sm text-foreground/80">
          How can I help you today?
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          {aiQuickActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                setValue(action);
                submit(action);
              }}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-[13px] font-medium text-foreground shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Wand2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {action}
            </button>
          ))}
        </div>

        {(isThinking || reply) && (
          <div className="scrollbar-thin mt-4 max-h-24 overflow-y-auto rounded-xl border border-primary/15 bg-card/70 p-3">
            {isThinking ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Thinking
                </span>
                <span className="flex gap-1" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-foreground/80">
                {reply}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-auto flex items-center gap-2 pt-4">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            aria-label="Ask the AI assistant anything"
          />
        </div>
        <Button
          size="icon"
          onClick={() => submit()}
          disabled={!value.trim() || isThinking}
          aria-label="Send message"
          className="h-10 w-10 shrink-0 bg-gradient-to-br from-primary to-brand-purple hover:from-primary/90 hover:to-brand-purple/90"
        >
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export { AIAssistant };