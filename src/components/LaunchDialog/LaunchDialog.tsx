import type { CSSProperties } from 'react';

interface Props {
  title: string;
  message: string;
  icon: string;
  durationMs: number;
}

/**
 * A small "starting program" window with a segmented progress bar, shown
 * while a program launches. The bar fills over `durationMs`.
 */
export const LaunchDialog = ({ title, message, icon, durationMs }: Props) => (
  <div
    className="window launch-dialog"
    role="status"
    aria-live="polite"
    aria-label={title}
    style={{ '--launch-duration': `${durationMs}ms` } as CSSProperties}
  >
    <div className="title-bar">
      <img className="title-bar-icon" src={icon} alt="" width={16} height={16} />
      <div className="title-bar-text">{title}</div>
    </div>
    <div className="window-body launch-body">
      <div className="launch-row">
        <img className="launch-icon" src={icon} alt="" width={32} height={32} />
        <p>{message}</p>
      </div>
      <div className="progress-indicator segmented launch-progress" aria-hidden="true">
        <span className="progress-indicator-bar" />
      </div>
    </div>
  </div>
);
