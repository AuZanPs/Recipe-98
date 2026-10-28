import { useCallback, useRef, useState } from 'react';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';

interface Options {
  enabled?: boolean;
  keepVisible?: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const useDraggableWindow = <T extends HTMLElement = HTMLDivElement>({
  enabled = true,
  keepVisible = 48,
}: Options = {}) => {
  const windowRef = useRef<T>(null);
  const dragRef = useRef<DragState | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    if ((event.target as HTMLElement).closest('.title-bar-controls')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const element = windowRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
      minX: keepVisible - rect.right,
      maxX: window.innerWidth - keepVisible - rect.left,
      minY: keepVisible - rect.bottom,
      maxY: window.innerHeight - keepVisible - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextX = drag.baseX + event.clientX - drag.startX;
    const nextY = drag.baseY + event.clientY - drag.startY;
    setOffset({
      x: Math.min(drag.maxX, Math.max(drag.minX, nextX)),
      y: Math.min(drag.maxY, Math.max(drag.minY, nextY)),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const resetPosition = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  const style: CSSProperties & Record<'--drag-x' | '--drag-y', string> = {
    '--drag-x': `${offset.x}px`,
    '--drag-y': `${offset.y}px`,
  };

  return {
    windowRef: windowRef as RefObject<T | null>,
    style,
    dragging,
    resetPosition,
    titleBarProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
};
