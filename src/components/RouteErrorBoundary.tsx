import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // keep fallback local to the route instead of crashing the whole app tree
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="space-y-4 rounded-[1.75rem] border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3 text-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h1 className="font-display text-2xl">{this.props.title || "Algo saiu do esperado"}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Essa tela falhou ao renderizar, mas o restante do app continua funcionando.
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>Tentar novamente</Button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
