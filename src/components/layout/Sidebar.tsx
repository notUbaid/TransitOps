import { NavLink } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { visibleModules } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const modules = visibleModules(user.role);

  return (
    <div className="flex h-full flex-col bg-surface-container px-4 py-6">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
          <Icon name="hub" className="text-primary" size={24} fill />
        </div>
        <div>
          <h1 className="text-headline-md font-extrabold tracking-tight text-primary">TransitOps</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Fleet Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {modules.map((m) => (
          <NavLink
            key={m.key}
            to={m.path}
            onClick={onNavigate}
            className={({ isActive }: { isActive: boolean }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 font-label-md text-label-md transition-all duration-200",
                isActive
                  ? "bg-primary-container font-bold text-on-primary-container"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
              )
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <Icon name={m.icon} size={20} fill={isActive} />
                <span>{m.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-high/60 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container font-label-md text-label-md font-bold text-on-secondary-container">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md font-medium text-on-surface">{user.name}</p>
            <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-on-surface-variant transition-all duration-200 hover:bg-error-container/20 hover:text-error"
        >
          <Icon name="logout" size={20} />
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </div>
    </div>
  );
}
