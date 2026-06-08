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
import { useCallback, useSyncExternalStore } from 'react';

interface UseMediaQueryOptions {
    fallbackValue?: boolean;
    serverValue?: boolean;
}

/**
 * Subscribes to a media query while providing a deterministic value during SSR.
 */
export function useMediaQuery(
    query: string,
    { fallbackValue = false, serverValue = false }: UseMediaQueryOptions = {}
): boolean {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const mediaQuery = globalThis.matchMedia?.(query);
            mediaQuery?.addEventListener('change', onStoreChange);
            return () => mediaQuery?.removeEventListener('change', onStoreChange);
        },
        [query]
    );
    const getSnapshot = useCallback(
        () => globalThis.matchMedia?.(query).matches ?? fallbackValue,
        [fallbackValue, query]
    );
    const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
