import type { Settings } from "./types";

const CURRENCY_META: Record<Settings["currency"], { symbol: string; locale: string }> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
};

export function formatCurrency(
  amount: number,
  currency: Settings["currency"] = "INR",
): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.INR;
  return `${meta.symbol}${new Intl.NumberFormat(meta.locale, {
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0))}`;
}

/** Compact currency, e.g. ₹4.5L / $42k for chart labels. */
export function formatCompactCurrency(
  amount: number,
  currency: Settings["currency"] = "INR",
): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.INR;
  const abs = Math.abs(amount);
  if (currency === "INR") {
    if (abs >= 1e7) return `${meta.symbol}${(amount / 1e7).toFixed(1)}Cr`;
    if (abs >= 1e5) return `${meta.symbol}${(amount / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${meta.symbol}${(amount / 1e3).toFixed(1)}k`;
    return `${meta.symbol}${Math.round(amount)}`;
  }
  if (abs >= 1e6) return `${meta.symbol}${(amount / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${meta.symbol}${(amount / 1e3).toFixed(1)}k`;
  return `${meta.symbol}${Math.round(amount)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Whole days from today until the given date (negative if past). */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function isExpired(iso: string): boolean {
  return daysUntil(iso) < 0;
}

/** Expiring within `withinDays` (default 30) but not yet expired. */
export function isExpiringSoon(iso: string, withinDays = 30): boolean {
  const d = daysUntil(iso);
  return d >= 0 && d <= withinDays;
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
