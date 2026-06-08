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
import { describe, expect, test, vi } from 'vitest';
import ImageGallery from './index';

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({ src, alt }: { src: string; alt: string }) => (
        <img data-testid="dynamic-image" src={src} alt={alt} />
    ),
}));

vi.mock('@/components/product-image-zoom', () => ({
    default: ({ selectedImageIndex }: { selectedImageIndex: number }) => (
        <div data-testid="product-image-zoom">{selectedImageIndex}</div>
    ),
}));

vi.mock('@/targets/ui-target', () => ({
    UITarget: ({ children }: React.PropsWithChildren) => children,
}));

const images = [
    { src: 'https://example.com/one.jpg', alt: 'One' },
    { src: 'https://example.com/two.jpg', alt: 'Two' },
];

describe('ImageGallery zoom integration', () => {
    test('keeps the standard primary image when zoom is disabled', () => {
        render(<ImageGallery images={images} />);

        expect(screen.getByTestId('dynamic-image')).toBeInTheDocument();
        expect(screen.queryByTestId('product-image-zoom')).not.toBeInTheDocument();
    });

    test('passes thumbnail selection into the zoom component', () => {
        render(<ImageGallery images={images} enableZoom />);

        expect(screen.getByTestId('product-image-zoom')).toHaveTextContent('0');
        fireEvent.click(screen.getAllByRole('button')[1]);
        expect(screen.getByTestId('product-image-zoom')).toHaveTextContent('1');
    });

    test('passes arrow selection into the zoom component', () => {
        render(<ImageGallery images={images} enableZoom showNavigationArrows />);

        fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
        expect(screen.getByTestId('product-image-zoom')).toHaveTextContent('1');
    });
});
