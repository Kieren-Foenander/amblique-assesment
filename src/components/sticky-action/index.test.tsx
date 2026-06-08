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
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import StickyAction, { useStickyActionMode } from './index';

let observerCallback: IntersectionObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();
const resizeObserve = vi.fn();
const resizeDisconnect = vi.fn();

class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
    }

    observe = observe;
    disconnect = disconnect;
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '';
    thresholds = [];
}

class MockResizeObserver {
    observe = resizeObserve;
    disconnect = resizeDisconnect;
    unobserve = vi.fn();
}

function AdaptiveAction() {
    const mode = useStickyActionMode();
    return <button>{mode}</button>;
}

const notifyObserver = ({ isIntersecting, bottom }: { isIntersecting: boolean; bottom: number }) => {
    act(() => {
        observerCallback(
            [
                {
                    isIntersecting,
                    boundingClientRect: { bottom },
                } as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
        );
    });
};

describe('StickyAction', () => {
    beforeEach(() => {
        vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
        vi.stubGlobal('ResizeObserver', MockResizeObserver);
        vi.stubGlobal('matchMedia', () => ({
            matches: true,
            media: '(max-width: 767px)',
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
        observe.mockClear();
        disconnect.mockClear();
        resizeObserve.mockClear();
        resizeDisconnect.mockClear();
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
            height: 72,
        } as DOMRect);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    test('renders only the inline action on the server', () => {
        const html = renderToString(
            <StickyAction>
                <AdaptiveAction />
            </StickyAction>
        );

        expect(html).toContain('inline');
        expect(html).not.toContain('sticky-action');
        expect(html).not.toContain('sticky</button>');
    });

    test('shows the sticky action only after the inline action was seen and passes above the viewport', () => {
        render(
            <StickyAction>
                <AdaptiveAction />
            </StickyAction>
        );

        const shell = screen.getByTestId('sticky-action');
        const spacer = screen.getByTestId('sticky-action-spacer');
        expect(observe).toHaveBeenCalledOnce();
        expect(resizeObserve).toHaveBeenCalledWith(shell);
        expect(document.body).toHaveStyle('--sticky-action-height: 72px');
        expect(screen.getByRole('button', { name: 'inline' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'sticky' })).not.toBeInTheDocument();
        expect(shell).toHaveAttribute('inert');
        expect(spacer).toHaveClass('h-0');

        notifyObserver({ isIntersecting: false, bottom: 100 });
        expect(screen.queryByRole('button', { name: 'sticky' })).not.toBeInTheDocument();

        notifyObserver({ isIntersecting: true, bottom: 20 });
        expect(screen.queryByRole('button', { name: 'sticky' })).not.toBeInTheDocument();

        notifyObserver({ isIntersecting: false, bottom: -1 });
        expect(screen.getByRole('button', { name: 'sticky' })).toBeInTheDocument();
        expect(shell).toHaveClass('translate-y-0');
        expect(shell).not.toHaveAttribute('inert');
        expect(spacer).toHaveClass('h-[var(--sticky-action-height)]');

        notifyObserver({ isIntersecting: false, bottom: 100 });
        expect(screen.queryByRole('button', { name: 'sticky' })).not.toBeInTheDocument();
        expect(shell).toHaveClass('translate-y-full');
        expect(shell).toHaveAttribute('inert');
        expect(spacer).toHaveClass('h-0');
    });
});
