import { useEffect, useRef } from 'react';
import { statusOrb } from 'asciify-engine/kit';
import type { StatusOrbHandle } from 'asciify-engine/kit';

export type AsciiStatusState = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  state: AsciiStatusState;
  label: string;
}

export const AsciiStatus = ({ state, label }: Props) => {
  const hostRef = useRef<HTMLSpanElement>(null);
  const orbRef = useRef<StatusOrbHandle | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const orb = statusOrb(hostRef.current, {
      ring: true,
      colourByState: true,
      lazy: false,
      ink: '--ascii-ink-strong',
      look: { font: '"IBM Plex Mono", monospace', cellSize: 3 },
    });
    orbRef.current = orb;

    return () => {
      orb.destroy();
      orbRef.current = null;
    };
  }, []);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    if (state === 'loading') orb.loading();
    else if (state === 'success') orb.success();
    else if (state === 'error') orb.error();
    else orb.idle();
  }, [state]);

  return (
    <span
      ref={hostRef}
      className="ascii-status"
      aria-hidden="true"
      title={label}
    />
  );
};
