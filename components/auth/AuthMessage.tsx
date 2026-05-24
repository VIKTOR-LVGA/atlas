import { cn } from "@/lib/utils";

type MessageVariant = "success" | "error" | "info";

const styles: Record<MessageVariant, string> = {
  success: "atlas-alert-success",
  error: "atlas-alert-danger",
  info: "atlas-alert-info",
};

interface AuthMessageProps {
  variant: MessageVariant;
  message: string;
  className?: string;
}

export function AuthMessage({ variant, message, className }: AuthMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "atlas-message-enter rounded-xl border px-4 py-3 text-[13px] leading-relaxed",
        styles[variant],
        className
      )}
    >
      {message}
    </div>
  );
}
