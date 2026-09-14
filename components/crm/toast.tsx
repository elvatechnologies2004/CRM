"use client";

import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string | null;
}

function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
      aria-live="polite"
    >
      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
      {message}
    </div>
  );
}

export { Toast };