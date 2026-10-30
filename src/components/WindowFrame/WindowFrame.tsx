import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  Ref,
} from 'react';

interface Props {
  title: string;
  children: ReactNode;
  controls?: ReactNode;
  className?: string;
  style?: CSSProperties;
  windowRef?: Ref<HTMLElement>;
  titleBarProps?: HTMLAttributes<HTMLDivElement>;
  icon?: string;
  hidden?: boolean;
}

export const WindowFrame = ({
  title,
  children,
  controls,
  className,
  style,
  windowRef,
  titleBarProps,
  icon,
  hidden,
}: Props) => (
  <section
    ref={windowRef}
    className={`window ${className ?? ''}`.trim()}
    style={style}
    hidden={hidden}
    tabIndex={-1}
    aria-label={title}
  >
    <div className="title-bar" {...titleBarProps}>
      {icon && <img className="title-bar-icon" src={icon} alt="" width={16} height={16} />}
      <div className="title-bar-text">{title}</div>
      {controls && <div className="title-bar-controls">{controls}</div>}
    </div>
    <div className="window-body">{children}</div>
  </section>
);
