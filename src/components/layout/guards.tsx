import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { landingPath, type ModuleKey } from "@/lib/rbac";
import { EmptyState } from "@/components/ui/primitives";

/** Blocks the whole dashboard shell for unauthenticated users. */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Guards a single module route by RBAC access level. */
export function RequireModule({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { user, canView } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canView(module)) {
    // Send the user somewhere they are allowed to be.
    return <Navigate to={landingPath(user.role)} replace />;
  }
  return <>{children}</>;
}

/** Inline "read only" notice for pages a role can view but not edit. */
export function ReadOnlyNotice() {
  return (
    <div className="glass flex items-center gap-3 rounded-xl border border-secondary/20 px-4 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          visibility
        </span>
      </span>
      <p className="text-body-md text-on-surface-variant">
        You have <span className="font-semibold text-secondary">read-only</span> access to this module.
        Editing actions are disabled for your role.
      </p>
    </div>
  );
}

export function NoAccess() {
  return (
    <EmptyState
      icon="lock"
      title="No access"
      description="Your role does not have permission to view this module."
    />
  );
}
