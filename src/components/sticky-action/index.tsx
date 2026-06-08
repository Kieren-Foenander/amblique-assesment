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
import { createContext, Fragment, type PropsWithChildren, use, useEffect, useReducer, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

type StickyActionMode = 'inline' | 'sticky';
type StickyActionState = {
    hasBeenSeen: boolean;
    isStickyVisible: boolean;
};

const StickyActionModeContext = createContext<StickyActionMode>('inline');
const mobileMediaQuery = '(max-width: 767px)';
const stickyActionHeightProperty = '--sticky-action-height';
const initialStickyActionState: StickyActionState = {
    hasBeenSeen: false,
    isStickyVisible: false,
};

const stickyActionReducer = (
    state: StickyActionState,
    entry: Pick<IntersectionObserverEntry, 'boundingClientRect' | 'isIntersecting'>
): StickyActionState => {
    if (entry.isIntersecting) {
        return { hasBeenSeen: true, isStickyVisible: false };
    }

    return {
        ...state,
        isStickyVisible: state.hasBeenSeen && entry.boundingClientRect.bottom <= 0,
    };
};

/**
 * Returns where a child of StickyAction is currently rendered so the child can
 * adapt its presentation without moving action-specific logic into StickyAction.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useStickyActionMode = () => use(StickyActionModeContext);

/**
 * Renders an action inline and repeats it in a mobile fixed-bottom shell after
 * the inline action has been seen and scrolled above the viewport.
 */
export default function StickyAction({ children }: PropsWithChildren) {
    const inlineRef = useRef<HTMLDivElement | null>(null);
    const stickyRef = useRef<HTMLDivElement | null>(null);
    const isMobile = useMediaQuery(mobileMediaQuery, { fallbackValue: true });
    const [{ hasBeenSeen, isStickyVisible }, dispatch] = useReducer(stickyActionReducer, initialStickyActionState);

    useEffect(() => {
        const inlineElement = inlineRef.current;
        if (!isMobile || !inlineElement || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry) return;
            dispatch(entry);
        });

        observer.observe(inlineElement);
        return () => observer.disconnect();
    }, [isMobile]);

    useEffect(() => {
        const stickyElement = stickyRef.current;
        if (!isMobile || !stickyElement) return;

        const updateStickyActionHeight = () => {
            document.body.style.setProperty(
                stickyActionHeightProperty,
                `${stickyElement.getBoundingClientRect().height}px`
            );
        };

        updateStickyActionHeight();

        const observer =
            typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateStickyActionHeight);
        observer?.observe(stickyElement);
        return () => {
            observer?.disconnect();
            document.body.style.removeProperty(stickyActionHeightProperty);
        };
    }, [isMobile]);

    const stickyPortal = (
        <Fragment>
            <div
                ref={stickyRef}
                data-testid="sticky-action"
                aria-hidden={!isStickyVisible}
                inert={!isStickyVisible}
                className={cn(
                    'fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg transition-transform duration-300 ease-in-out md:hidden',
                    isStickyVisible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
                )}>
                {hasBeenSeen ? (
                    <StickyActionModeContext.Provider value="sticky">{children}</StickyActionModeContext.Provider>
                ) : null}
            </div>
            <div
                data-testid="sticky-action-spacer"
                aria-hidden="true"
                className={cn(
                    'shrink-0 transition-[height] duration-300 ease-in-out md:hidden',
                    isStickyVisible ? 'h-[var(--sticky-action-height)]' : 'h-0'
                )}
            />
        </Fragment>
    );

    return (
        <>
            <div ref={inlineRef}>
                <StickyActionModeContext.Provider value="inline">{children}</StickyActionModeContext.Provider>
            </div>
            {isMobile ? createPortal(stickyPortal, document.body) : null}
        </>
    );
}
