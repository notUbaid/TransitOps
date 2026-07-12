import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

// ---------------- Button ----------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconRight?: string;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary/90",
  secondary:
    "bg-surface-container-high text-on-surface border border-white/10 hover:bg-surface-variant",
  outline:
    "border border-white/10 text-on-surface hover:bg-surface-container-high",
  ghost: "text-on-surface-variant hover:text-on-surface hover:bg-white/5",
  danger:
    "bg-error/15 text-error border border-error/40 hover:bg-error/25",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-label-md text-label-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5" : "px-4 py-2.5",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  );
}

// ---------------- Card ----------------
export function Card({
  className,
  children,
  interactive,
  ...props
}: { className?: string; children: ReactNode; interactive?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-xl",
        interactive && "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------- Field ----------------
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="font-label-md text-label-md text-on-surface-variant">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-label-sm font-label-sm text-error">{error}</span>
      ) : hint ? (
        <span className="text-label-sm font-label-sm text-on-surface-variant/70">{hint}</span>
      ) : null}
    </div>
  );
}

// ---------------- Inputs ----------------
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input-field", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("input-field", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input-field resize-none", className)} {...props} />;
}

// ---------------- Badge ----------------
export function Badge({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className?: string;
  icon?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-medium tracking-wider",
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

// ---------------- Empty state ----------------
export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
        <Icon name={icon} size={26} />
      </div>
      <div>
        <p className="text-headline-md font-semibold text-on-surface">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-body-md text-on-surface-variant">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ---------------- Page header ----------------
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col gap-4 rounded-xl p-5 md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon name={icon} size={22} />
          </div>
        )}
        <div>
          <h2 className="text-headline-lg font-semibold text-on-surface">{title}</h2>
          {subtitle && <p className="mt-1 text-body-md text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------------- Spinner ----------------
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

// ---------------- Skeleton ----------------
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-shimmer rounded-md", className)} {...props} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass flex flex-col gap-4 rounded-xl p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-start gap-3">
          <Skeleton className="mt-0.5 h-10 w-10 shrink-0 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      
      {/* 4 Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* 2 Big Blocks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="glass h-64 w-full rounded-xl" />
        <Skeleton className="glass h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
