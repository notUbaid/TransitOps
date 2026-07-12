import { lazy, Suspense, type ComponentType } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth, RequireModule } from "@/components/layout/guards";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Spinner, DashboardSkeleton } from "@/components/ui/primitives";
import type { ModuleKey } from "@/lib/rbac";

import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";

// Code-split the authenticated pages (keeps Recharts out of the initial bundle).
const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Fleet = lazy(() => import("@/pages/Fleet").then((m) => ({ default: m.Fleet })));
const Drivers = lazy(() => import("@/pages/Drivers").then((m) => ({ default: m.Drivers })));
const Trips = lazy(() => import("@/pages/Trips").then((m) => ({ default: m.Trips })));
const Maintenance = lazy(() => import("@/pages/Maintenance").then((m) => ({ default: m.Maintenance })));
const Expenses = lazy(() => import("@/pages/Expenses").then((m) => ({ default: m.Expenses })));
const Analytics = lazy(() => import("@/pages/Analytics").then((m) => ({ default: m.Analytics })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));

const MODULE_ROUTES: { path: string; module: ModuleKey; Component: ComponentType }[] = [
  { path: "/dashboard", module: "dashboard", Component: Dashboard },
  { path: "/fleet", module: "fleet", Component: Fleet },
  { path: "/drivers", module: "drivers", Component: Drivers },
  { path: "/trips", module: "trips", Component: Trips },
  { path: "/maintenance", module: "maintenance", Component: Maintenance },
  { path: "/expenses", module: "expenses", Component: Expenses },
  { path: "/analytics", module: "analytics", Component: Analytics },
  { path: "/settings", module: "settings", Component: Settings },
];

function PageLoader() {
  return (
    <div className="animate-fade-in">
      <DashboardSkeleton />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StoreProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route element={<RequireAuth />}>
                    <Route element={<AppLayout />}>
                      {MODULE_ROUTES.map(({ path, module, Component }) => (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <RequireModule module={module}>
                              <Suspense fallback={<PageLoader />}>
                                <Component />
                              </Suspense>
                            </RequireModule>
                          }
                        />
                      ))}
                    </Route>
                  </Route>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
