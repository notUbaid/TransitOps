import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 md:items-center">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "glass-strong animate-scale-in relative z-10 my-auto w-full rounded-2xl",
          SIZES[size],
        )}
      >
        <div className="flex items-start gap-3 border-b border-outline-variant p-5">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Icon name={icon} size={22} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-headline-md font-semibold text-on-surface">{title}</h3>
            {description && (
              <p className="mt-0.5 text-body-md text-on-surface-variant">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-on-surface-variant transition-colors hover:bg-black/5 hover:text-on-surface"
            aria-label="Close"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-outline-variant p-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
