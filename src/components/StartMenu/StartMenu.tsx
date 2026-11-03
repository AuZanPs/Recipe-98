import { useEffect, useRef, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
} from 'react';
import { Close, Computer, Folder, InfoBox, Power, Settings2 } from 'pixelarticons/react';

type SubmenuName = 'programs' | 'settings';

interface Props {
  startButtonRef: RefObject<HTMLButtonElement | null>;
  plum: boolean;
  canCloseWindow: boolean;
  /** Dismiss the menu without choosing anything (outside click, Escape). */
  onDismiss: () => void;
  onOpenApp: () => void;
  onOpenSettings: () => void;
  onSetTheme: (plum: boolean) => void;
  onOpenHelp: () => void;
  onCloseWindow: () => void;
  onShutDown: () => void;
}

const iconProps = { width: 16, height: 16, 'aria-hidden': true } as const;

const MenuItem = ({
  role = 'menuitem',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
  <button type="button" role={role} tabIndex={-1} className={className} {...rest}>
    {children}
  </button>
);

export const StartMenu = ({
  startButtonRef,
  plum,
  canCloseWindow,
  onDismiss,
  onOpenApp,
  onOpenSettings,
  onSetTheme,
  onOpenHelp,
  onCloseWindow,
  onShutDown,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<SubmenuName | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      if (startButtonRef.current?.contains(target)) return;
      onDismiss();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (submenu) {
        setSubmenu(null);
        return;
      }
      onDismiss();
      startButtonRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss, startButtonRef, submenu]);

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[data-submenu-button]')
      ?.focus();
  }, []);

  const openSubmenu = (name: SubmenuName) => {
    setSubmenu(name);
    window.requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLButtonElement>(`[data-submenu="${name}"] button`)
        ?.focus();
    });
  };

  const handleSubmenuKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    name: SubmenuName,
  ) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const buttons = [...event.currentTarget.querySelectorAll('button')];
      const current = buttons.findIndex((button) => button === document.activeElement);
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(current + offset + buttons.length) % buttons.length]?.focus();
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setSubmenu(null);
      menuRef.current
        ?.querySelector<HTMLButtonElement>(`[data-submenu-button="${name}"]`)
        ?.focus();
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      onDismiss();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '.start-menu-items > button, .start-menu-items > .start-menu-group > button',
      ) ?? []),
    ];
    if (items.length === 0) return;

    const current = items.findIndex((item) => item === document.activeElement);
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else next = (current - 1 + items.length) % items.length;

    event.preventDefault();
    items[next]?.focus();
  };

  const submenuTrigger = (name: SubmenuName, icon: ReactNode, label: string) => (
    <MenuItem
      className="with-icon"
      data-submenu-button={name}
      aria-haspopup="menu"
      aria-expanded={submenu === name}
      onMouseEnter={() => setSubmenu(name)}
      onClick={() => openSubmenu(name)}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowRight') return;
        event.preventDefault();
        openSubmenu(name);
      }}
    >
      {icon}
      {label}
      <span className="start-arrow" aria-hidden="true">▸</span>
    </MenuItem>
  );

  return (
    <div
      ref={menuRef}
      className="window start-menu"
      role="menu"
      aria-label="Start menu"
      onKeyDown={handleMenuKeyDown}
    >
      <div className="start-menu-banner" aria-hidden="true">Recipe 98</div>
      <div className="start-menu-items">
        <div className="start-menu-group">
          {submenuTrigger('programs', <Folder {...iconProps} />, 'Programs')}
          {submenu === 'programs' && (
            <div
              className="window start-submenu"
              role="menu"
              aria-label="Programs"
              data-submenu="programs"
              onKeyDown={(event) => handleSubmenuKeyDown(event, 'programs')}
            >
              <MenuItem className="with-icon" onClick={onOpenApp}>
                <Computer {...iconProps} />
                Recipe Finder
              </MenuItem>
            </div>
          )}
        </div>

        <div className="start-menu-group">
          {submenuTrigger('settings', <Settings2 {...iconProps} />, 'Settings')}
          {submenu === 'settings' && (
            <div
              className="window start-submenu"
              role="menu"
              aria-label="Settings"
              data-submenu="settings"
              onKeyDown={(event) => handleSubmenuKeyDown(event, 'settings')}
            >
              <MenuItem className="with-icon" onClick={onOpenSettings}>
                <Settings2 {...iconProps} />
                Display Properties...
              </MenuItem>
              <hr />
              <MenuItem
                role="menuitemradio"
                aria-checked={!plum}
                onClick={() => onSetTheme(false)}
              >
                <span className="start-check" aria-hidden="true">
                  {plum ? '' : '✓'}
                </span>
                Standard
              </MenuItem>
              <MenuItem
                role="menuitemradio"
                aria-checked={plum}
                onClick={() => onSetTheme(true)}
              >
                <span className="start-check" aria-hidden="true">
                  {plum ? '✓' : ''}
                </span>
                Plum
              </MenuItem>
            </div>
          )}
        </div>

        <hr />

        <MenuItem
          className="with-icon"
          onMouseEnter={() => setSubmenu(null)}
          onClick={onOpenHelp}
        >
          <InfoBox {...iconProps} />
          Help
        </MenuItem>
        {canCloseWindow && (
          <MenuItem
            className="with-icon"
            onMouseEnter={() => setSubmenu(null)}
            onClick={onCloseWindow}
          >
            <Close {...iconProps} />
            Close Window
          </MenuItem>
        )}
        <MenuItem
          className="with-icon"
          onMouseEnter={() => setSubmenu(null)}
          onClick={onShutDown}
        >
          <Power {...iconProps} />
          Shut Down...
        </MenuItem>
      </div>
    </div>
  );
};
