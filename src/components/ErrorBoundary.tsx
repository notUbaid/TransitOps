import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("TransitOps crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="glass-strong w-full max-w-md rounded-2xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
              <span className="material-symbols-outlined" style={{ fontSize: 30 }}>
                error
              </span>
            </div>
            <h1 className="text-headline-md font-semibold text-on-surface">Something went wrong</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-label-md text-label-md font-medium text-on-primary hover:bg-primary-fixed-dim"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
