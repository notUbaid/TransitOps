import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { collectAlerts } from "@/lib/analytics";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface SearchResult {
  label: string;
  sub: string;
  icon: string;
  path: string;
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { db } = useStore();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const alerts = useMemo(() => collectAlerts(db), [db]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: SearchResult[] = [];
    for (const v of db.vehicles) {
      if (v.registrationNo.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)) {
        out.push({ label: v.registrationNo, sub: v.name, icon: "local_shipping", path: `/fleet?q=${encodeURIComponent(v.registrationNo)}` });
      }
    }
    for (const d of db.drivers) {
      if (d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q)) {
        out.push({ label: d.name, sub: d.licenseNumber, icon: "badge", path: `/drivers?q=${encodeURIComponent(d.name)}` });
      }
    }
    for (const t of db.trips) {
      if (
        t.code.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
      ) {
        out.push({ label: t.code, sub: `${t.source} → ${t.destination}`, icon: "route", path: `/trips?q=${encodeURIComponent(t.code)}` });
      }
    }
    return out.slice(0, 6);
  }, [query, db]);

  const go = (path: string) => {
    setSearchOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/10 px-4 md:px-6">
      {/* Left */}
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface md:hidden"
          aria-label="Open menu"
        >
          <Icon name="menu" size={22} />
        </button>

        <div className="relative w-full max-w-md">
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search vehicles, drivers, trips…"
            className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchOpen && results.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
              <div className="glass-strong absolute left-0 right-0 top-12 z-20 overflow-hidden rounded-xl p-1.5">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => go(r.path)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <Icon name={r.icon} size={18} className="text-on-surface-variant" />
                    <span className="flex-1">
                      <span className="block text-body-md text-on-surface">{r.label}</span>
                      <span className="block font-label-sm text-label-sm text-on-surface-variant">{r.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={toggle}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
          aria-label="Toggle theme"
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
        </button>

        {/* Alerts */}
        <div className="relative">
          <button
            onClick={() => setAlertsOpen((o) => !o)}
            className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
            aria-label="Alerts"
          >
            <Icon name="notifications" size={20} />
            {alerts.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-label-sm text-[10px] font-bold text-on-error">
                {alerts.length}
              </span>
            )}
          </button>
          {alertsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAlertsOpen(false)} />
              <div className="glass-strong absolute right-0 top-12 z-20 w-[min(90vw,340px)] overflow-hidden rounded-xl">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-body-md font-semibold text-on-surface">Alerts</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {alerts.length} item{alerts.length === 1 ? "" : "s"} need attention
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="px-4 py-6 text-center text-body-md text-on-surface-variant">All clear ✨</p>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 border-b border-white/5 px-4 py-3 last:border-0">
                        <Icon
                          name={a.icon}
                          size={18}
                          className={cn("mt-0.5", a.severity === "error" ? "text-error" : "text-tertiary")}
                        />
                        <div>
                          <p className="text-body-md text-on-surface">{a.title}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{a.detail}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container font-label-md text-label-md font-bold text-on-secondary-container">
          {user?.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
      </div>
    </header>
  );
}
