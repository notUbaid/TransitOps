import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { landingPath } from "@/lib/rbac";
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

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("dispatcher");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to={landingPath(user.role)} replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const res = await register({ name, email, password, role });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate(landingPath(res.data!.role), { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-[5%] top-[10%] h-[45%] w-[45%] rounded-full bg-primary-container/40 blur-[130px]" />
        <div className="absolute -right-[5%] bottom-[5%] h-[40%] w-[40%] rounded-full bg-tertiary-container/30 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <Icon name="hub" className="text-primary" size={30} fill />
          </div>
          <h1 className="text-headline-lg font-extrabold tracking-tight text-on-surface">Create your account</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Join the TransitOps operations console.</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Rivera" autoComplete="name" required />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@transitops.in" autoComplete="username" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-on-surface-variant hover:text-on-surface"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} size={16} />
                  </button>
                </div>
              </Field>
              <Field label="Confirm">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </Field>
            </div>

            <Field label="Role">
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-2.5 text-left transition-all",
                      role === r
                        ? "border-primary/50 bg-primary/10"
                        : "border-white/10 bg-surface-container-low/60 hover:border-primary/30",
                    )}
                  >
                    <Icon name={ROLE_ICON[r]} size={18} className={role === r ? "text-primary" : "text-on-surface-variant"} />
                    <span>
                      <span className="block text-body-md font-medium leading-tight text-on-surface">{ROLE_LABELS[r]}</span>
                      <span className="block font-label-sm text-label-sm text-on-surface-variant">{ROLE_TAGLINES[r]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Field>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2.5">
                <Icon name="error" size={18} className="text-error" />
                <span className="text-body-md text-error">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" iconRight="arrow_forward">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
