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
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 2;

type Point = {
    x: number;
    y: number;
};

type Translation = Point;

const distanceBetween = (first: Point, second: Point) => Math.hypot(second.x - first.x, second.y - first.y);

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

const clampTranslation = (translation: Translation, scale: number, element: HTMLElement): Translation => {
    const { width, height } = element.getBoundingClientRect();
    const maximumX = (width * (scale - MIN_SCALE)) / 2;
    const maximumY = (height * (scale - MIN_SCALE)) / 2;

    return {
        x: clamp(translation.x, -maximumX, maximumX),
        y: clamp(translation.y, -maximumY, maximumY),
    };
};

export function usePinchZoom() {
    const [scale, setScale] = useState(MIN_SCALE);
    const [translation, setTranslation] = useState<Translation>({ x: 0, y: 0 });
    const pointersRef = useRef(new Map<number, Point>());
    const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
    const panStartRef = useRef<{ point: Point; translation: Translation } | null>(null);

    const reset = useCallback(() => {
        pointersRef.current.clear();
        pinchStartRef.current = null;
        panStartRef.current = null;
        setScale(MIN_SCALE);
        setTranslation({ x: 0, y: 0 });
    }, []);

    const onPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            if (event.pointerType === 'mouse') return;

            const point = { x: event.clientX, y: event.clientY };
            pointersRef.current.set(event.pointerId, point);

            if (pointersRef.current.size === 2) {
                const [first, second] = [...pointersRef.current.values()];
                pinchStartRef.current = {
                    distance: distanceBetween(first, second),
                    scale,
                };
                panStartRef.current = null;
                event.currentTarget.setPointerCapture(event.pointerId);
            } else if (scale > MIN_SCALE) {
                panStartRef.current = { point, translation };
                event.currentTarget.setPointerCapture(event.pointerId);
            }
        },
        [scale, translation]
    );

    const onPointerMove = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            if (event.pointerType === 'mouse' || !pointersRef.current.has(event.pointerId)) return;

            const point = { x: event.clientX, y: event.clientY };
            pointersRef.current.set(event.pointerId, point);

            if (pointersRef.current.size === 2 && pinchStartRef.current) {
                event.preventDefault();
                const element = event.currentTarget;
                const [first, second] = [...pointersRef.current.values()];
                const nextScale = clamp(
                    pinchStartRef.current.scale *
                        (distanceBetween(first, second) / Math.max(pinchStartRef.current.distance, 1)),
                    MIN_SCALE,
                    MAX_SCALE
                );
                setScale(nextScale);
                setTranslation((current) => clampTranslation(current, nextScale, element));
            } else if (scale > MIN_SCALE && panStartRef.current) {
                event.preventDefault();
                const nextTranslation = {
                    x: panStartRef.current.translation.x + point.x - panStartRef.current.point.x,
                    y: panStartRef.current.translation.y + point.y - panStartRef.current.point.y,
                };
                setTranslation(clampTranslation(nextTranslation, scale, event.currentTarget));
            }
        },
        [scale]
    );

    const onPointerEnd = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            pointersRef.current.delete(event.pointerId);
            pinchStartRef.current = null;
            panStartRef.current = null;

            if (pointersRef.current.size === 1 && scale > MIN_SCALE) {
                const point = [...pointersRef.current.values()][0];
                panStartRef.current = { point, translation };
            }
        },
        [scale, translation]
    );

    return {
        scale,
        translation,
        isZoomed: scale > MIN_SCALE,
        reset,
        pointerHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp: onPointerEnd,
            onPointerCancel: onPointerEnd,
        },
    };
}
