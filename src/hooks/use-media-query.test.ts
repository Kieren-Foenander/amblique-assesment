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
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('returns the current match and responds to changes', () => {
        let matches = false;
        let onChange: (() => void) | undefined;
        vi.stubGlobal('matchMedia', (query: string) => ({
            matches,
            media: query,
            addEventListener: vi.fn((_event, listener: () => void) => {
                onChange = listener;
            }),
            removeEventListener: vi.fn(),
        }));

        const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
        expect(result.current).toBe(false);

        act(() => {
            matches = true;
            onChange?.();
        });
        expect(result.current).toBe(true);
    });

    test('uses the provided fallback when matchMedia is unavailable', () => {
        vi.stubGlobal('matchMedia', undefined);

        const { result } = renderHook(() => useMediaQuery('(max-width: 767px)', { fallbackValue: true }));

        expect(result.current).toBe(true);
    });

    test('subscribes to a new media query when the query changes', () => {
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();
        vi.stubGlobal('matchMedia', (query: string) => ({
            matches: query.includes('hover'),
            media: query,
            addEventListener,
            removeEventListener,
        }));

        const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
            initialProps: { query: '(max-width: 767px)' },
        });
        expect(result.current).toBe(false);

        rerender({ query: '(hover: hover)' });

        expect(result.current).toBe(true);
        expect(removeEventListener).toHaveBeenCalledOnce();
        expect(addEventListener).toHaveBeenCalledTimes(2);
    });
});
