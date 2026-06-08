import { useCallback, useRef, type MouseEvent, type PointerEvent } from 'react';

interface UseSwipeOptions {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    threshold?: number;
}

/**
 * Detects deliberate horizontal touch swipes while leaving vertical page scrolling intact.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 40 }: UseSwipeOptions) {
    const startPoint = useRef<{ x: number; y: number; pointerId: number } | null>(null);
    const suppressNextClick = useRef(false);

    const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch') return;

        startPoint.current = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
    }, []);

    const onPointerUp = useCallback(
        (event: PointerEvent<HTMLElement>) => {
            const start = startPoint.current;
            startPoint.current = null;

            if (!start || event.pointerType !== 'touch' || event.pointerId !== start.pointerId) return;

            event.currentTarget.releasePointerCapture?.(event.pointerId);
            const deltaX = event.clientX - start.x;
            const deltaY = event.clientY - start.y;

            if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) return;

            suppressNextClick.current = true;
            if (deltaX < 0) {
                onSwipeLeft();
            } else {
                onSwipeRight();
            }
        },
        [onSwipeLeft, onSwipeRight, threshold]
    );

    const onPointerCancel = useCallback(() => {
        startPoint.current = null;
    }, []);

    const onClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
        if (!suppressNextClick.current) return;

        suppressNextClick.current = false;
        event.preventDefault();
        event.stopPropagation();
    }, []);

    return {
        onPointerDown,
        onPointerUp,
        onPointerCancel,
        onClickCapture,
    };
}
