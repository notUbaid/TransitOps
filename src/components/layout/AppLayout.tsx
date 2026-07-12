import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[280px] border-r border-white/10 shadow-xl md:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div className={cn("md:hidden", drawerOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            "fixed bottom-0 left-0 top-0 z-50 w-[280px] border-r border-white/10 shadow-2xl transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute right-3 top-5 rounded-full p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
            aria-label="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>

      {/* Content column */}
      <div className="relative flex min-h-screen flex-col md:ml-[280px]">
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-20">
          <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-primary-container blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-tertiary-container blur-[120px]" />
        </div>

        <Topbar onMenuClick={() => setDrawerOpen(true)} />

        <main className="relative z-10 flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
