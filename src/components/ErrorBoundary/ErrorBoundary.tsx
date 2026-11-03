import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Recipe 98 crashed:', error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="app-shell bsod" id="main" role="alert">
        <p className="bsod-banner">Recipe Discovery 98</p>
        <p>
          A fatal exception 0E has occurred in the recipe finder. The current
          application will be terminated.
        </p>
        <p className="bsod-detail">{error.message || 'Unknown error.'}</p>
        <ul className="bsod-list">
          <li>Press Try Again to restart the recipe finder.</li>
          <li>Press Reload Page to restart the whole desktop.</li>
        </ul>
        {import.meta.env.DEV && error.stack && (
          <details className="bsod-trace">
            <summary>Stack trace</summary>
            <pre>{error.stack}</pre>
          </details>
        )}
        <div className="bsod-actions">
          <button type="button" onClick={this.handleRetry}>Try Again</button>
          <button type="button" onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </main>
    );
  }
}
