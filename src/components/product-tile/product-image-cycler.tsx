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
import { useCallback, useEffect, useMemo, useReducer, useRef, useSyncExternalStore, type MouseEvent } from 'react';
import type { ShopperProducts, ShopperSearch } from '@salesforce/storefront-next-runtime/scapi';
import { useTranslation } from 'react-i18next';
import { Link } from '@/components/link';
import { ProductImageContainer } from '@/components/product-image';
import { ProductImage } from '@/components/product-image/product-image';
import { createProductUrl, getImagesForColor } from '@/lib/product-utils';
import { cn } from '@/lib/utils';
import { useDynamicImageContext } from '@/providers/dynamic-image';
import { useSwipe } from '@/hooks/use-swipe';

interface ProductImageCyclerProps {
    product: ShopperSearch.schemas['ProductSearchHit'];
    selectedColorValue?: string | null;
    className?: string;
    handleProductClick?: (product: ShopperSearch.schemas['ProductSearchHit']) => void;
    imgAspectRatio?: number;
}

const CROSSFADE_DURATION_MS = 200;

const getImageUrl = (image?: ShopperProducts.schemas['Image']) => image?.disBaseLink || image?.link || '';
const unsubscribeFromHydration = () => undefined;
const subscribeToHydration = () => unsubscribeFromHydration;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

interface CyclerState {
    displayedIndex: number;
    targetIndex: number | null;
    targetLoaded: boolean;
}

type CyclerAction =
    | { type: 'request'; direction: -1 | 1; imageCount: number }
    | { type: 'targetReady' }
    | { type: 'commit' }
    | { type: 'reset' };

const initialCyclerState: CyclerState = {
    displayedIndex: 0,
    targetIndex: null,
    targetLoaded: false,
};

function cyclerReducer(state: CyclerState, action: CyclerAction): CyclerState {
    switch (action.type) {
        case 'request': {
            if (state.targetIndex !== null) return state;

            const targetIndex = (state.displayedIndex + action.direction + action.imageCount) % action.imageCount;
            if (targetIndex === state.displayedIndex) return state;

            return { ...state, targetIndex, targetLoaded: false };
        }
        case 'targetReady':
            return state.targetIndex === null ? state : { ...state, targetLoaded: true };
        case 'commit':
            return state.targetIndex === null
                ? state
                : { displayedIndex: state.targetIndex, targetIndex: null, targetLoaded: false };
        case 'reset':
            return initialCyclerState;
    }
}

function getCyclerImages(product: ShopperSearch.schemas['ProductSearchHit'], selectedColorValue: string | null) {
    const selectedImages = getImagesForColor(product, selectedColorValue, 'medium');
    const defaultImages = getImagesForColor(product, null, 'medium');
    const candidates = selectedImages.length > 0 ? selectedImages : defaultImages;
    const images = candidates.length > 0 ? candidates : product.image ? [product.image] : [];
    const seen = new Set<string>();

    return images.filter((image) => {
        const url = getImageUrl(image);
        if (!url || seen.has(url)) return false;
        seen.add(url);
        return true;
    });
}

export function ProductImageCycler({
    product,
    selectedColorValue = null,
    className,
    handleProductClick,
    imgAspectRatio = 1,
}: ProductImageCyclerProps) {
    const { t } = useTranslation('product');
    const imageContext = useDynamicImageContext();
    const images = useMemo(() => getCyclerImages(product, selectedColorValue), [product, selectedColorValue]);
    const isHydrated = useSyncExternalStore(
        subscribeToHydration,
        getClientHydrationSnapshot,
        getServerHydrationSnapshot
    );
    const [{ displayedIndex, targetIndex, targetLoaded }, dispatch] = useReducer(cyclerReducer, initialCyclerState);
    const hoverHalf = useRef<'left' | 'right' | null>(null);
    const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const imageAltFallback = product.productName || t('imageAlt') || 'Product Image';
    const displayedImage = images[displayedIndex] ?? images[0];
    const pendingImage = targetIndex === null ? undefined : images[targetIndex];
    const hasCycler = isHydrated && images.length > 1;
    const primaryImageUrl = getImageUrl(images[0]);

    useEffect(() => {
        if (transitionTimer.current) clearTimeout(transitionTimer.current);
        dispatch({ type: 'reset' });
        hoverHalf.current = null;
    }, [product.productId, selectedColorValue]);

    useEffect(() => {
        if (primaryImageUrl) imageContext?.addSource(primaryImageUrl);
    }, [imageContext, primaryImageUrl]);

    useEffect(
        () => () => {
            if (transitionTimer.current) clearTimeout(transitionTimer.current);
        },
        []
    );

    const requestIndex = useCallback(
        (direction: -1 | 1) => {
            if (!hasCycler || targetIndex !== null) return;

            if (transitionTimer.current) clearTimeout(transitionTimer.current);
            dispatch({ type: 'request', direction, imageCount: images.length });
        },
        [hasCycler, images.length, targetIndex]
    );

    const handleTargetReady = useCallback(() => {
        if (targetIndex === null) return;

        dispatch({ type: 'targetReady' });
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        transitionTimer.current = setTimeout(
            () => {
                dispatch({ type: 'commit' });
            },
            reduceMotion ? 0 : CROSSFADE_DURATION_MS
        );
    }, [targetIndex]);

    const handleClick = useCallback(() => {
        handleProductClick?.(product);
    }, [handleProductClick, product]);

    const handleHover = useCallback(
        (event: MouseEvent<HTMLAnchorElement>) => {
            const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
            if (!hasCycler || !canHover) {
                return;
            }

            const bounds = event.currentTarget.getBoundingClientRect();
            const half = event.clientX < bounds.left + bounds.width / 2 ? 'left' : 'right';
            if (half === hoverHalf.current) return;

            hoverHalf.current = half;
            requestIndex(half === 'left' ? -1 : 1);
        },
        [hasCycler, requestIndex]
    );

    const handlePointerLeave = useCallback(() => {
        hoverHalf.current = null;
    }, []);

    const swipeHandlers = useSwipe({
        onSwipeLeft: () => requestIndex(1),
        onSwipeRight: () => requestIndex(-1),
    });

    const heightStyle = imgAspectRatio !== 1 ? { aspectRatio: `${imgAspectRatio}` } : {};
    const productUrl = createProductUrl(product.productId, selectedColorValue);
    const activeIndex = targetLoaded && targetIndex !== null ? targetIndex : displayedIndex;
    const layerClass =
        'absolute inset-0 w-full h-full object-cover motion-safe:transition-opacity motion-safe:duration-200';
    if (images.length <= 1) {
        return (
            <ProductImageContainer
                product={product}
                selectedColorValue={selectedColorValue}
                className={className}
                handleProductClick={handleProductClick}
                imgAspectRatio={imgAspectRatio}
            />
        );
    }

    return (
        <div
            className={cn(
                'relative overflow-hidden bg-secondary/20 flex flex-col',
                imgAspectRatio === 1 && 'aspect-square',
                className
            )}
            style={heightStyle}>
            <Link
                to={productUrl}
                onClick={handleClick}
                onMouseEnter={handleHover}
                onMouseMove={handleHover}
                onMouseLeave={handlePointerLeave}
                className="relative block w-full h-full flex-1 touch-pan-y"
                aria-label={t('viewProductAriaLabel', { productName: imageAltFallback }) || imageAltFallback}
                {...swipeHandlers}>
                <div
                    key={getImageUrl(displayedImage)}
                    className={cn(
                        'absolute inset-0 motion-safe:transition-opacity motion-safe:duration-200',
                        targetLoaded && 'opacity-0'
                    )}>
                    <ProductImage
                        key={`${getImageUrl(displayedImage)}-${displayedIndex}`}
                        src={getImageUrl(displayedImage)}
                        alt={displayedImage?.alt || imageAltFallback}
                        className={layerClass}
                        widths={imageContext?.widths}
                    />
                </div>
                {pendingImage && (
                    <div
                        key={getImageUrl(pendingImage)}
                        aria-hidden
                        className={cn(
                            'absolute inset-0 motion-safe:transition-opacity motion-safe:duration-200',
                            targetLoaded ? 'opacity-100' : 'opacity-0'
                        )}>
                        <ProductImage
                            key={`${getImageUrl(pendingImage)}-${targetIndex}`}
                            src={getImageUrl(pendingImage)}
                            alt=""
                            loading="lazy"
                            className={layerClass}
                            widths={imageContext?.widths}
                            imageProps={{
                                onLoad: handleTargetReady,
                                onError: handleTargetReady,
                            }}
                        />
                    </div>
                )}
            </Link>

            {hasCycler && (
                <div
                    aria-hidden
                    data-testid="product-image-cycler-dots"
                    className="pointer-events-none absolute inset-x-3 bottom-1 z-10 flex items-center justify-center gap-1 overflow-hidden p-0.5">
                    {images.map((image, index) => (
                        <span
                            key={getImageUrl(image)}
                            className={cn(
                                'aspect-square min-w-0 max-w-2 flex-1 rounded-full ring-1',
                                index === activeIndex
                                    ? 'bg-foreground ring-background/90'
                                    : 'bg-background/90 ring-foreground/60'
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
