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
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProductImageZoom from './index';

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const images = [
    { src: 'https://example.com/one.jpg', alt: 'One' },
    { src: 'https://example.com/two.jpg', alt: 'Two' },
];

describe('ProductImageZoom', () => {
    beforeEach(() => {
        window.matchMedia = vi.fn().mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            callback(0);
            return 1;
        });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    test('toggles fixed keyboard zoom and exits with Escape', () => {
        render(<ProductImageZoom images={images} selectedImageIndex={0} imageAltFallback="Product" />);
        const control = screen.getByRole('button', { name: 'Zoom product image' });
        const transform = screen.getByTestId('product-image-zoom-transform');

        expect(screen.queryByTestId('product-image-zoom-focus-indicator')).not.toBeInTheDocument();
        fireEvent.focus(control);
        const focusIndicator = screen.getByTestId('product-image-zoom-focus-indicator');
        expect(focusIndicator).toHaveAttribute('aria-hidden', 'true');
        expect(focusIndicator).toHaveClass('border-4', 'border-transparent', 'outline-2', 'outline-primary');
        fireEvent.keyDown(control, { key: 'Enter' });
        expect(control).toHaveAttribute('aria-pressed', 'true');
        expect(control).toHaveAccessibleName('Exit product image zoom');
        expect(transform.style.getPropertyValue('--zoom-scale')).toBe('1.5');

        fireEvent.keyDown(control, { key: 'Escape' });
        expect(control).toHaveAttribute('aria-pressed', 'false');

        fireEvent.blur(control);
        expect(screen.queryByTestId('product-image-zoom-focus-indicator')).not.toBeInTheDocument();
    });

    test('enters hover zoom on fine pointers and exits on mouse leave', () => {
        render(<ProductImageZoom images={images} selectedImageIndex={0} imageAltFallback="Product" />);
        const control = screen.getByRole('button', { name: 'Zoom product image' });
        const transform = screen.getByTestId('product-image-zoom-transform');
        control.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0 }) as DOMRect;

        fireEvent.mouseEnter(control);
        fireEvent.mouseMove(control, { clientX: 0, clientY: 0 });
        expect(control).toHaveAttribute('aria-pressed', 'true');
        expect(transform.style.getPropertyValue('--zoom-scale')).toBe('2');
        expect(transform.style.getPropertyValue('--zoom-x')).toBe('100px');
        expect(transform.style.getPropertyValue('--zoom-y')).toBe('50px');

        fireEvent.mouseLeave(control);
        expect(control).toHaveAttribute('aria-pressed', 'false');
        expect(transform.style.getPropertyValue('--zoom-x')).toBe('0px');
        expect(transform.style.getPropertyValue('--zoom-y')).toBe('0px');
    });

    test('resets zoom when the selected image changes', () => {
        const renderZoom = (selectedImageIndex: number) => (
            <ProductImageZoom
                key={selectedImageIndex}
                images={images}
                selectedImageIndex={selectedImageIndex}
                imageAltFallback="Product"
            />
        );
        const { rerender } = render(renderZoom(0));
        fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });

        rerender(renderZoom(1));

        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('img')).toHaveAccessibleName('Two');
    });

    test('exits touch zoom when tapping elsewhere', () => {
        render(
            <>
                <ProductImageZoom images={images} selectedImageIndex={0} imageAltFallback="Product" />
                <button type="button">Elsewhere</button>
            </>
        );
        const control = screen.getByRole('button', { name: 'Zoom product image' });

        fireEvent.keyDown(control, { key: 'Enter' });
        fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }), { pointerType: 'touch' });

        expect(control).toHaveAttribute('aria-pressed', 'false');
    });
});
