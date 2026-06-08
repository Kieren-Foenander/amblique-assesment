import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useSwipe } from './use-swipe';

function SwipeTarget({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
    const handlers = useSwipe({ onSwipeLeft: onLeft, onSwipeRight: onRight });
    return <a href="/product" aria-label="View product" data-testid="target" {...handlers} />;
}

describe('useSwipe', () => {
    test('recognizes horizontal touch swipes in both directions', () => {
        const onLeft = vi.fn();
        const onRight = vi.fn();
        render(<SwipeTarget onLeft={onLeft} onRight={onRight} />);
        const target = screen.getByTestId('target');

        fireEvent.pointerDown(target, { pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 20 });
        fireEvent.pointerUp(target, { pointerType: 'touch', pointerId: 1, clientX: 40, clientY: 25 });
        fireEvent.pointerDown(target, { pointerType: 'touch', pointerId: 2, clientX: 40, clientY: 20 });
        fireEvent.pointerUp(target, { pointerType: 'touch', pointerId: 2, clientX: 100, clientY: 25 });

        expect(onLeft).toHaveBeenCalledOnce();
        expect(onRight).toHaveBeenCalledOnce();
    });

    test('rejects short, vertical, mouse, and stylus gestures', () => {
        const onLeft = vi.fn();
        const onRight = vi.fn();
        render(<SwipeTarget onLeft={onLeft} onRight={onRight} />);
        const target = screen.getByTestId('target');

        for (const gesture of [
            { pointerType: 'touch', startX: 100, startY: 20, endX: 70, endY: 20 },
            { pointerType: 'touch', startX: 100, startY: 20, endX: 40, endY: 100 },
            { pointerType: 'mouse', startX: 100, startY: 20, endX: 40, endY: 20 },
            { pointerType: 'pen', startX: 100, startY: 20, endX: 40, endY: 20 },
        ]) {
            fireEvent.pointerDown(target, {
                pointerType: gesture.pointerType,
                pointerId: 1,
                clientX: gesture.startX,
                clientY: gesture.startY,
            });
            fireEvent.pointerUp(target, {
                pointerType: gesture.pointerType,
                pointerId: 1,
                clientX: gesture.endX,
                clientY: gesture.endY,
            });
        }

        expect(onLeft).not.toHaveBeenCalled();
        expect(onRight).not.toHaveBeenCalled();
    });

    test('suppresses only the click immediately following a recognized swipe', () => {
        const onLeft = vi.fn();
        render(<SwipeTarget onLeft={onLeft} onRight={vi.fn()} />);
        const target = screen.getByTestId('target');

        fireEvent.pointerDown(target, { pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 20 });
        fireEvent.pointerUp(target, { pointerType: 'touch', pointerId: 1, clientX: 40, clientY: 20 });

        const firstClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        const secondClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        target.dispatchEvent(firstClick);
        target.dispatchEvent(secondClick);

        expect(firstClick.defaultPrevented).toBe(true);
        expect(secondClick.defaultPrevented).toBe(false);
    });
});
