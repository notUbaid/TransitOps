import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { landingPath } from "@/lib/rbac";
import { DEMO_PASSWORD } from "@/lib/seed";
import { ROLES, ROLE_LABELS, ROLE_TAGLINES, type Role } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button, Field, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ROLE_ICON: Record<Role, string> = {
  fleet_manager: "shield_person",
  dispatcher: "route",
  safety_officer: "health_and_safety",
  financial_analyst: "payments",
};

export function Login() {
  const { user, login } = useAuth();
  const { db } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? landingPath(user.role)} replace />;
  }

  const submit = (mail: string, pass: string) => {
    const res = login(mail, pass);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError("");
    navigate(landingPath(res.data!.role), { replace: true });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(email, password);
  };

  const loginAs = (role: Role) => {
    const account = db.users.find((u) => u.role === role);
    if (!account) return;
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    submit(account.email, DEMO_PASSWORD);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-[5%] top-[10%] h-[45%] w-[45%] rounded-full bg-primary-container/40 blur-[130px]" />
        <div className="absolute -right-[5%] bottom-[5%] h-[40%] w-[40%] rounded-full bg-tertiary-container/30 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <Icon name="hub" className="text-primary" size={30} fill />
          </div>
          <h1 className="text-headline-lg font-extrabold tracking-tight text-on-surface">TransitOps</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Smart Transport Operations Platform</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:p-8">
          <h2 className="text-headline-md font-semibold text-on-surface">Sign in</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Access your fleet operations console.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@transitops.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-on-surface-variant hover:text-on-surface"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </Field>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5">
                <Icon name="error" size={18} className="text-error" />
                <span className="text-body-md text-error">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" iconRight="arrow_forward">
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Demo accounts
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => loginAs(role)}
                className={cn(
                  "group flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-surface-container-low/60 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <Icon name={ROLE_ICON[role]} size={20} className="text-primary" />
                <span className="text-body-md font-medium text-on-surface">{ROLE_LABELS[role]}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{ROLE_TAGLINES[role]}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center font-label-sm text-label-sm text-on-surface-variant">
            One-click sign in · shared password <span className="text-on-surface">{DEMO_PASSWORD}</span>
          </p>
        </div>

        <p className="mt-6 text-center text-body-md text-on-surface-variant">
          New to TransitOps?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
