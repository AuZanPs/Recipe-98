import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StartMenu } from '../components/StartMenu/StartMenu';
import { useKonamiCode } from '../hooks/useKonamiCode';

const press = (...keys: string[]) => {
  for (const key of keys) fireEvent.keyDown(window, { key });
};

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
];

describe('useKonamiCode', () => {
  it('fires after the full sequence, case-insensitively, and can repeat', () => {
    const onMatch = vi.fn();
    renderHook(() => useKonamiCode(onMatch));

    press(...KONAMI.slice(0, -1), 'A');
    expect(onMatch).toHaveBeenCalledTimes(1);

    press(...KONAMI);
    expect(onMatch).toHaveBeenCalledTimes(2);
  });

  it('resets on a wrong key', () => {
    const onMatch = vi.fn();
    renderHook(() => useKonamiCode(onMatch));

    press(...KONAMI.slice(0, 5), 'x', ...KONAMI.slice(5));
    expect(onMatch).not.toHaveBeenCalled();
  });

  it('restarts when the wrong key is the first key of the code', () => {
    const onMatch = vi.fn();
    renderHook(() => useKonamiCode(onMatch));

    press('ArrowUp', ...KONAMI);
    expect(onMatch).toHaveBeenCalledTimes(1);
  });
});

describe('StartMenu', () => {
  const setup = (overrides: Partial<Parameters<typeof StartMenu>[0]> = {}) => {
    const props = {
      startButtonRef: createRef<HTMLButtonElement>(),
      plum: false,
      canCloseWindow: true,
      onDismiss: vi.fn(),
      onOpenApp: vi.fn(),
      onOpenSettings: vi.fn(),
      onSetTheme: vi.fn(),
      onOpenHelp: vi.fn(),
      onCloseWindow: vi.fn(),
      ...overrides,
    };
    render(<StartMenu {...props} />);
    return props;
  };

  it('focuses the first item when it opens', () => {
    setup();
    expect(screen.getByRole('menuitem', { name: /programs/i })).toHaveFocus();
  });

  it('opens the Programs submenu and launches the app', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('menuitem', { name: /programs/i }));
    await user.click(screen.getByRole('menuitem', { name: 'Recipe Finder' }));

    expect(props.onOpenApp).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem', { name: /welcome window/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Favorites' })).toBeNull();
  });

  it('switches the theme from the Settings submenu', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('menuitem', { name: /settings/i }));
    expect(screen.getByRole('menuitemradio', { name: /standard/i })).toBeChecked();
    await user.click(screen.getByRole('menuitemradio', { name: /plum/i }));

    expect(props.onSetTheme).toHaveBeenCalledWith(true);
  });

  it('opens help and closes the window from the main list', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('menuitem', { name: 'Help' }));
    await user.click(screen.getByRole('menuitem', { name: 'Close Window' }));

    expect(props.onOpenHelp).toHaveBeenCalledTimes(1);
    expect(props.onCloseWindow).toHaveBeenCalledTimes(1);
  });

  it('hides Close Window when there is no window to close', () => {
    setup({ canCloseWindow: false });
    expect(screen.queryByRole('menuitem', { name: 'Close Window' })).toBeNull();
  });

  it('moves focus with the arrow keys and wraps around', async () => {
    const user = userEvent.setup();
    setup();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /settings/i })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Close Window' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /programs/i })).toHaveFocus();
  });

  it('closes the submenu first on Escape, then the menu', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('menuitem', { name: /programs/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: 'Recipe Finder' })).toBeNull();
    expect(props.onDismiss).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on an outside click', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(document.body);

    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });
});
