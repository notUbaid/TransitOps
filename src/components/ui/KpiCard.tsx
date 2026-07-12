import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Accent = "primary" | "secondary" | "tertiary" | "emerald" | "error";

const ACCENT: Record<Accent, { icon: string; glow: string }> = {
  primary: { icon: "text-primary", glow: "bg-primary/10 group-hover:bg-primary/20" },
  secondary: { icon: "text-secondary", glow: "bg-secondary/10 group-hover:bg-secondary/20" },
  tertiary: { icon: "text-tertiary", glow: "bg-tertiary-container/15 group-hover:bg-tertiary-container/25" },
  emerald: { icon: "text-emerald-300", glow: "bg-emerald-500/10 group-hover:bg-emerald-500/20" },
  error: { icon: "text-error", glow: "bg-error/10 group-hover:bg-error/20" },
};

interface KpiCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon: string;
  accent?: Accent;
  trend?: { direction: "up" | "down"; value: string; positive?: boolean };
  progress?: number; // 0-100
  footnote?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  icon,
  accent = "primary",
  trend,
  progress,
  footnote,
}: KpiCardProps) {
  const a = ACCENT[accent];
  return (
    <div className="glass group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
      <div className="relative">
        <div className="mb-2 flex items-start justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            {label}
          </span>
          <Icon name={icon} className={a.icon} size={22} />
        </div>
        <div className="text-display font-bold text-on-surface">
          {value}
          {unit && <span className="ml-1 text-xl text-on-surface-variant">{unit}</span>}
        </div>

        {trend && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 font-label-md text-label-md",
              trend.positive ? "text-emerald-400" : "text-error",
            )}
          >
            <Icon name={trend.direction === "up" ? "trending_up" : "trending_down"} size={16} />
            {trend.value}
          </div>
        )}

        {progress != null && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}

        {footnote && <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">{footnote}</p>}
      </div>
    </div>
  );
}
