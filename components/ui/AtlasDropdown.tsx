"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type AtlasDropdownProps = {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
  ariaLabel: string;
};

export function AtlasDropdown({
  trigger,
  children,
  align = "end",
  panelClassName,
  ariaLabel,
}: AtlasDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute z-50 mt-2 max-w-[min(100vw-1.5rem,20rem)] rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-[var(--shadow-card)]",
            align === "end" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type AtlasDropdownItemProps = {
  children: ReactNode;
  onSelect?: () => void;
  href?: string;
  destructive?: boolean;
  disabled?: boolean;
};

export function AtlasDropdownItem({
  children,
  onSelect,
  href,
  destructive = false,
  disabled = false,
}: AtlasDropdownItemProps) {
  const className = cn(
    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition",
    destructive
      ? "text-[var(--danger-text)] hover:bg-[var(--danger-bg)]"
      : "text-foreground hover:bg-card-muted",
    disabled && "pointer-events-none opacity-50"
  );

  if (href && !disabled) {
    return (
      <a role="menuitem" href={href} className={className} onClick={onSelect}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={className}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

export function AtlasDropdownDivider() {
  return <div role="separator" className="my-1 border-t border-border-subtle" />;
}

export function AtlasDropdownHeader({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 py-2 text-[10px] leading-snug text-muted">{children}</div>
  );
}
