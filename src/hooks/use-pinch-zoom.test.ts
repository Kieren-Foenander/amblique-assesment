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
import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { usePinchZoom } from './use-pinch-zoom';

const element = document.createElement('div');
element.getBoundingClientRect = () =>
    ({ width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100, x: 0, y: 0, toJSON: vi.fn() }) as DOMRect;
element.setPointerCapture = vi.fn();

const pointerEvent = (pointerId: number, clientX: number, clientY: number) =>
    ({
        pointerId,
        pointerType: 'touch',
        clientX,
        clientY,
        currentTarget: element,
        preventDefault: vi.fn(),
    }) as any;

describe('usePinchZoom', () => {
    test('clamps pinch scaling between 100% and 200%', () => {
        const { result } = renderHook(() => usePinchZoom());

        act(() => {
            result.current.pointerHandlers.onPointerDown(pointerEvent(1, 0, 0));
            result.current.pointerHandlers.onPointerDown(pointerEvent(2, 100, 0));
            result.current.pointerHandlers.onPointerMove(pointerEvent(2, 400, 0));
        });
        expect(result.current.scale).toBe(2);

        act(() => result.current.pointerHandlers.onPointerMove(pointerEvent(2, 0, 0)));
        expect(result.current.scale).toBe(1);
    });

    test('pans only while zoomed and clamps translation to the image bounds', () => {
        const { result } = renderHook(() => usePinchZoom());

        act(() => {
            result.current.pointerHandlers.onPointerDown(pointerEvent(1, 0, 0));
            result.current.pointerHandlers.onPointerMove(pointerEvent(1, 80, 40));
        });
        expect(result.current.translation).toEqual({ x: 0, y: 0 });

        act(() => {
            result.current.pointerHandlers.onPointerDown(pointerEvent(2, 100, 0));
            result.current.pointerHandlers.onPointerMove(pointerEvent(2, 200, 0));
        });
        act(() => {
            result.current.pointerHandlers.onPointerUp(pointerEvent(2, 200, 0));
        });
        act(() => result.current.pointerHandlers.onPointerMove(pointerEvent(1, 500, 500)));

        expect(result.current.translation).toEqual({ x: 100, y: 50 });
    });

    test('reset restores the initial transform', () => {
        const { result } = renderHook(() => usePinchZoom());

        act(() => {
            result.current.pointerHandlers.onPointerDown(pointerEvent(1, 0, 0));
            result.current.pointerHandlers.onPointerDown(pointerEvent(2, 100, 0));
            result.current.pointerHandlers.onPointerMove(pointerEvent(2, 200, 0));
        });
        act(() => result.current.reset());

        expect(result.current.scale).toBe(1);
        expect(result.current.translation).toEqual({ x: 0, y: 0 });
        expect(result.current.isZoomed).toBe(false);
    });
});
