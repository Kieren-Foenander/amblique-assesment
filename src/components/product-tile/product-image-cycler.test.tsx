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
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperSearch } from '@salesforce/storefront-next-runtime/scapi';
import { ProductImageCycler } from './product-image-cycler';

vi.mock('@/components/link', () => ({
    Link: ({ children, to, ...props }: any) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/components/product-image', () => ({
    ProductImageContainer: () => <div data-testid="single-image-container" />,
}));

vi.mock('@/components/product-image/product-image', () => ({
    ProductImage: ({ src, alt, loading, imageProps, className }: any) => (
        <img src={src} alt={alt} loading={loading} className={className} {...imageProps} />
    ),
}));

vi.mock('@/providers/dynamic-image', () => ({
    useDynamicImageContext: () => ({ widths: ['50vw'], addSource: vi.fn() }),
}));

const product: ShopperSearch.schemas['ProductSearchHit'] = {
    productId: 'product-1',
    productName: 'Product One',
    imageGroups: [
        {
            viewType: 'medium',
            images: [
                { link: 'https://example.com/one.jpg', alt: 'One' },
                { link: 'https://example.com/two.jpg', alt: 'Two' },
                { link: 'https://example.com/two.jpg', alt: 'Duplicate Two' },
                { link: 'https://example.com/three.jpg', alt: 'Three' },
            ],
        },
    ],
};

describe('ProductImageCycler', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn((query: string) => ({
                matches: query.includes('hover: hover'),
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        });
    });

    test('renders only the primary image before interaction and deduplicates dots', () => {
        render(<ProductImageCycler product={product} />);

        expect(screen.getAllByRole('img')).toHaveLength(1);
        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/one.jpg');
        expect(screen.getByTestId('product-image-cycler-dots').children).toHaveLength(3);
    });

    test('server-renders only the primary image without dots', () => {
        const html = renderToString(<ProductImageCycler product={product} />);

        expect(html.match(/<img/g)).toHaveLength(1);
        expect(html).not.toContain('product-image-cycler-dots');
        expect(html).toContain('https://example.com/one.jpg');
        expect(html).not.toContain('https://example.com/two.jpg');
    });

    test('mounts one lazy target and updates the active dot only after it loads', () => {
        render(<ProductImageCycler product={product} />);
        const link = screen.getByRole('link');

        fireEvent.pointerDown(link, { pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 20 });
        fireEvent.pointerUp(link, { pointerType: 'touch', pointerId: 1, clientX: 40, clientY: 20 });

        const images = document.querySelectorAll('img');
        expect(images).toHaveLength(2);
        expect(images[1]).toHaveAttribute('src', 'https://example.com/two.jpg');
        expect(images[1]).toHaveAttribute('loading', 'lazy');
        expect(screen.getByTestId('product-image-cycler-dots').children[0]).toHaveClass('bg-foreground');

        fireEvent.load(images[1]);
        expect(screen.getByTestId('product-image-cycler-dots').children[1]).toHaveClass('bg-foreground');
    });

    test('ignores further interactions while the requested image is loading', () => {
        render(<ProductImageCycler product={product} />);
        const link = screen.getByRole('link');

        fireEvent.pointerDown(link, { pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 20 });
        fireEvent.pointerUp(link, { pointerType: 'touch', pointerId: 1, clientX: 40, clientY: 20 });
        fireEvent.pointerDown(link, { pointerType: 'touch', pointerId: 2, clientX: 100, clientY: 20 });
        fireEvent.pointerUp(link, { pointerType: 'touch', pointerId: 2, clientX: 40, clientY: 20 });

        const images = document.querySelectorAll('img');
        expect(images).toHaveLength(2);
        expect(images[1]).toHaveAttribute('src', 'https://example.com/two.jpg');
    });

    test('does not skip an image when re-entering the same hover half before load', () => {
        render(<ProductImageCycler product={product} />);
        const link = screen.getByRole('link');
        vi.spyOn(link, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            width: 200,
        } as DOMRect);

        fireEvent.mouseEnter(link, { clientX: 150 });
        fireEvent.mouseLeave(link);
        fireEvent.mouseEnter(link, { clientX: 150 });

        const images = document.querySelectorAll('img');
        expect(images).toHaveLength(2);
        expect(images[1]).toHaveAttribute('src', 'https://example.com/two.jpg');
    });

    test('wraps backward when entering the left hover half', () => {
        render(<ProductImageCycler product={product} />);
        const link = screen.getByRole('link');
        vi.spyOn(link, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            width: 200,
        } as DOMRect);

        fireEvent.mouseEnter(link, { clientX: 20 });

        expect(document.querySelectorAll('img')[1]).toHaveAttribute('src', 'https://example.com/three.jpg');
    });

    test('delegates single-image products to the existing image container', () => {
        render(
            <ProductImageCycler
                product={{
                    ...product,
                    imageGroups: [{ viewType: 'medium', images: [{ link: 'https://example.com/one.jpg' }] }],
                }}
            />
        );

        expect(screen.getByTestId('single-image-container')).toBeInTheDocument();
        expect(screen.queryByTestId('product-image-cycler-dots')).not.toBeInTheDocument();
    });
});
