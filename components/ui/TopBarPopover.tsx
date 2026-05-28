"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TopBarPopoverProps = {
  ariaLabel: string;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
};

type PanelPosition = {
  top: number;
  left: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
};

export function TopBarPopover({
  ariaLabel,
  trigger,
  children,
  align = "end",
  panelClassName,
}: TopBarPopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) {
      return;
    }

    const rect = triggerEl.getBoundingClientRect();
    const viewportPadding = 8;
    const maxWidth = Math.min(320, window.innerWidth - viewportPadding * 2);
    const minWidth = Math.min(maxWidth, Math.max(rect.width, 200));
    const gap = 8;
    const left = Math.min(
      Math.max(
        viewportPadding,
        align === "end" ? rect.right - maxWidth : rect.left
      ),
      window.innerWidth - maxWidth - viewportPadding
    );

    const panelHeight =
      panelRef.current?.offsetHeight ??
      Math.min(280, window.innerHeight - viewportPadding * 2);
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    let top = rect.bottom + gap;

    if (spaceBelow < panelHeight && spaceAbove > spaceBelow) {
      top = Math.max(viewportPadding, rect.top - panelHeight - gap);
    } else {
      top = Math.min(
        top,
        window.innerHeight - panelHeight - viewportPadding
      );
    }

    setPosition({
      top,
      left,
      minWidth,
      maxWidth,
      maxHeight: Math.min(
        panelHeight,
        window.innerHeight - viewportPadding * 2
      ),
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const onResize = () => updatePosition();
    const onScroll = () => updatePosition();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const toggle = () => {
    setOpen((value) => !value);
  };

  const panel =
    open && isClient && position ? (
      <div
        ref={panelRef}
        id={menuId}
        role="menu"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          minWidth: position.minWidth,
          maxWidth: position.maxWidth,
          maxHeight: position.maxHeight,
          overflowY: "auto",
          zIndex: 200,
        }}
        className={cn(
          "rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-[var(--shadow-card)]",
          panelClassName
        )}
      >
        {children}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {trigger}
      </button>
      {isClient && panel ? createPortal(panel, document.body) : null}
    </>
  );
}

export function TopBarPopoverItem({
  children,
  href,
  onSelect,
  destructive = false,
}: {
  children: ReactNode;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
}) {
  const className = cn(
    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[12px] font-medium transition",
    destructive
      ? "text-[var(--danger-text)] hover:bg-[var(--danger-bg)]"
      : "text-foreground hover:bg-card-muted"
  );

  if (href) {
    return (
      <a role="menuitem" href={href} className={className} onClick={onSelect}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" role="menuitem" className={className} onClick={onSelect}>
      {children}
    </button>
  );
}

export function TopBarPopoverDivider() {
  return <div role="separator" className="my-1 border-t border-border-subtle" />;
}

export function TopBarPopoverHeader({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 py-2 text-[11px] leading-snug text-muted">{children}</div>
  );
}

export function TopBarPopoverNote({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 py-2 text-[10px] leading-relaxed text-muted">{children}</p>
  );
}
