import { cn } from "@/lib/utils";

type MessageVariant = "success" | "error" | "info";

const styles: Record<MessageVariant, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  error: "border-red-100 bg-red-50 text-red-800",
  info: "border-blue-100 bg-blue-50 text-blue-800",
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
        "rounded-xl border px-4 py-3 text-[13px] leading-relaxed",
        styles[variant],
        className
      )}
    >
      {message}
    </div>
  );
}
