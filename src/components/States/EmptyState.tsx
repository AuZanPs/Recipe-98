interface Props {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ title, message, actionLabel, onAction }: Props) => (
  <div className="empty-state">
    <div className="window empty-state-window">
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
      </div>
      <div className="window-body">
        <p className="empty-title" dir="auto">{message}</p>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction}>{actionLabel}</button>
        )}
      </div>
    </div>
  </div>
);
