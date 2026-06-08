/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
