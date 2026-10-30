import { AsciiStatus } from '../AsciiStatus/AsciiStatus';

// Inline Windows 98–style loading indicator (non-blocking).
export const Loading = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="loading-inline" role="status">
    <AsciiStatus state="loading" label={message} />
    <div className="progress-indicator loading-progress" aria-hidden="true">
      <span className="progress-indicator-bar" />
    </div>
    <span>{message}</span>
  </div>
);
