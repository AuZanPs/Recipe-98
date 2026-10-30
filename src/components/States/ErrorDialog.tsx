interface Props {
  message: string;
  onRetry?: () => void;
}

export const ErrorDialog = ({ message, onRetry }: Props) => (
  <div className="error-container" role="alert">
    <div className="window error-window">
      <div className="title-bar">
        <div className="title-bar-text">Error</div>
      </div>
      <div className="window-body">
        <p className="error-title">Something went wrong</p>
        <p dir="auto">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}>Try Again</button>
        )}
      </div>
    </div>
  </div>
);
