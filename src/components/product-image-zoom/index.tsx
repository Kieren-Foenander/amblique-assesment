import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicImage } from '@/components/dynamic-image';
import type { ProductImage } from '@/components/image-gallery';
import { usePinchZoom } from '@/hooks/use-pinch-zoom';
import { cn } from '@/lib/utils';

interface ProductImageZoomProps {
    images: ProductImage[];
    selectedImageIndex: number;
    imageAltFallback: string;
    eager?: boolean;
}

const HOVER_SCALE = 2;
const KEYBOARD_SCALE = 1.5;
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

function subscribeToFinePointer(callback: () => void): () => void {
    const mediaQuery = globalThis.matchMedia?.(FINE_POINTER_QUERY);
    mediaQuery?.addEventListener('change', callback);
    return () => mediaQuery?.removeEventListener('change', callback);
}

function getFinePointerSnapshot(): boolean {
    return globalThis.matchMedia?.(FINE_POINTER_QUERY).matches ?? false;
}

function getFinePointerServerSnapshot(): boolean {
    return false;
}

export default function ProductImageZoom({
    images,
    selectedImageIndex,
    imageAltFallback,
    eager = false,
}: ProductImageZoomProps): ReactElement | null {
    const { t } = useTranslation('product');
    const containerRef = useRef<HTMLDivElement>(null);
    const transformRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isFinePointer = useSyncExternalStore(
        subscribeToFinePointer,
        getFinePointerSnapshot,
        getFinePointerServerSnapshot
    );
    const [isHoverZoomed, setIsHoverZoomed] = useState(false);
    const [isKeyboardZoomed, setIsKeyboardZoomed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const {
        scale: pinchScale,
        translation,
        isZoomed: isPinchZoomed,
        reset: resetPinch,
        pointerHandlers,
    } = usePinchZoom();
    const selectedImage = images[selectedImageIndex] ?? images[0];

    const resetMousePosition = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        transformRef.current?.style.setProperty('--zoom-x', '0px');
        transformRef.current?.style.setProperty('--zoom-y', '0px');
    }, []);

    const reset = useCallback(() => {
        setIsHoverZoomed(false);
        setIsKeyboardZoomed(false);
        resetPinch();
        resetMousePosition();
    }, [resetMousePosition, resetPinch]);

    useEffect(() => {
        const handleOutsidePointerDown = (event: PointerEvent) => {
            if (event.pointerType === 'mouse' || containerRef.current?.contains(event.target as Node)) return;
            reset();
        };
        document.addEventListener('pointerdown', handleOutsidePointerDown);
        return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
    }, [reset]);

    useEffect(
        () => () => {
            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        },
        []
    );

    const handleMouseMove = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!isFinePointer || isKeyboardZoomed) return;
            const element = event.currentTarget;
            const { left, top, width, height } = element.getBoundingClientRect();
            const x = Math.min(Math.max((event.clientX - left) / width, 0), 1);
            const y = Math.min(Math.max((event.clientY - top) / height, 0), 1);

            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = requestAnimationFrame(() => {
                animationFrameRef.current = null;
                const transform = transformRef.current;
                if (!transform) return;
                transform.style.setProperty('--zoom-x', `${(0.5 - x) * width}px`);
                transform.style.setProperty('--zoom-y', `${(0.5 - y) * height}px`);
            });
        },
        [isFinePointer, isKeyboardZoomed]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsKeyboardZoomed((current) => !current);
                setIsHoverZoomed(false);
                resetPinch();
                resetMousePosition();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                reset();
            }
        },
        [reset, resetMousePosition, resetPinch]
    );

    if (!selectedImage) return null;

    const scale = isKeyboardZoomed ? KEYBOARD_SCALE : isHoverZoomed ? HOVER_SCALE : pinchScale;
    const translateX = isPinchZoomed ? `${translation.x}px` : 'var(--zoom-x, 0px)';
    const translateY = isPinchZoomed ? `${translation.y}px` : 'var(--zoom-y, 0px)';
    const isZoomed = isKeyboardZoomed || isHoverZoomed || isPinchZoomed;
    const transformStyle = {
        '--zoom-scale': scale,
        '--zoom-translate-x': translateX,
        '--zoom-translate-y': translateY,
    } as CSSProperties;

    return (
        <div
            ref={containerRef}
            role="button"
            tabIndex={0}
            aria-pressed={isZoomed}
            aria-label={isZoomed ? t('exitImageZoom') : t('zoomImage')}
            className={cn(
                'relative h-full w-full overflow-hidden outline-none',
                isFinePointer && !isKeyboardZoomed && 'cursor-zoom-in',
                isPinchZoomed ? 'touch-none' : 'touch-pan-y'
            )}
            onMouseEnter={() => {
                if (isFinePointer && !isKeyboardZoomed) setIsHoverZoomed(true);
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                setIsHoverZoomed(false);
                resetMousePosition();
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
                setIsFocused(false);
                setIsKeyboardZoomed(false);
            }}
            onKeyDown={handleKeyDown}
            {...pointerHandlers}>
            {isFocused && (
                <div
                    aria-hidden="true"
                    data-testid="product-image-zoom-focus-indicator"
                    className="pointer-events-none absolute inset-2 z-20 border-4 border-transparent outline-2 outline-primary"
                />
            )}
            <div
                ref={transformRef}
                data-testid="product-image-zoom-transform"
                className="h-full w-full will-change-transform"
                style={{
                    ...transformStyle,
                    transform: 'translate(var(--zoom-translate-x), var(--zoom-translate-y)) scale(var(--zoom-scale))',
                }}>
                <DynamicImage
                    src={`${selectedImage.src}[?sw={width}]`}
                    alt={selectedImage.alt || imageAltFallback}
                    widths={['100vw', '680px']}
                    className="pointer-events-none w-full h-full object-cover object-center [&_img]:object-contain! [&_img]:h-full! [&_img]:max-w-full! [&_img]:mx-auto!"
                    loading={eager ? 'eager' : 'lazy'}
                    priority={eager ? 'high' : undefined}
                />
            </div>
        </div>
    );
}
