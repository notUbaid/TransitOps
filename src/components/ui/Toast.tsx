import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info" | "warning";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const KIND_META: Record<ToastKind, { icon: string; bar: string; text: string }> = {
  success: { icon: "check_circle", bar: "bg-success", text: "text-success" },
  error: { icon: "error", bar: "bg-error", text: "text-error" },
  info: { icon: "info", bar: "bg-primary", text: "text-primary" },
  warning: { icon: "warning", bar: "bg-warning", text: "text-warning" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++seq.current;
      setToasts((t) => [...t, { id, kind, message }]);
      window.setTimeout(() => remove(id), 3800);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
      warning: (m) => push("warning", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => {
          const meta = KIND_META[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className="animate-fade-in flex items-start gap-3 overflow-hidden rounded-2xl bg-white p-3.5 pr-4 shadow-lg ring-1 ring-black/5"
            >
              <span className={cn("mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full", meta.bar)} />
              <Icon name={meta.icon} className={cn("mt-0.5 shrink-0", meta.text)} size={20} />
              <p className="text-body-md leading-snug text-on-surface">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="ml-auto shrink-0 rounded-full p-0.5 text-on-surface-variant transition-colors hover:text-on-surface"
                aria-label="Dismiss"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
