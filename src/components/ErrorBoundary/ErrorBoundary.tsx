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
      <div className="app-shell">
        <div className="window main-shell">
          <div className="title-bar">
            <div className="title-bar-text">Recipe Discovery - System Error</div>
          </div>
          <div className="window-body error-boundary">
            <h1>Application Error</h1>
            <p>The recipe finder hit an unexpected problem.</p>
            <div className="sunken-panel error-details" role="alert">
              {error.message || 'Unknown error.'}
            </div>
            {import.meta.env.DEV && error.stack && (
              <details>
                <summary>Stack trace</summary>
                <pre>{error.stack}</pre>
              </details>
            )}
            <div className="button-row">
              <button type="button" onClick={this.handleRetry}>Try Again</button>
              <button type="button" onClick={() => window.location.reload()}>Reload Page</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
