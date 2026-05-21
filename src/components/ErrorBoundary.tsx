import { Component, ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Something went wrong</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error.message || "An unexpected error occurred."}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.reset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90"
              >
                <RotateCw className="w-4 h-4" /> Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-md text-sm bg-muted text-foreground hover:bg-muted/70"
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
