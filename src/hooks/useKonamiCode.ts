import { useEffect, useRef } from 'react';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/** Calls `onMatch` each time the Konami code is typed anywhere on the page. */
export const useKonamiCode = (onMatch: () => void) => {
  const onMatchRef = useRef(onMatch);

  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    // Compare against the most recent keys so a stray leading key (an extra
    // ArrowUp, say) does not make the sequence impossible to complete.
    let recent: string[] = [];
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      recent = [...recent, key].slice(-KONAMI_CODE.length);
      if (recent.join() === KONAMI_CODE.join()) {
        recent = [];
        onMatchRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
