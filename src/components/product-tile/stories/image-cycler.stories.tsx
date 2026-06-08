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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import ProductTile from '../index';
import productTileMeta from './product-tile.stories';
import { waitForStorybookReady } from '@storybook/test-utils';
// @ts-expect-error mock file is JS
import { mockProductSearchItem } from '../../__mocks__/product-search-hit-data';

const meta = {
    ...productTileMeta,
    title: 'Components/ProductTile/Image Cycler',
} satisfies Meta<typeof ProductTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        product: mockProductSearchItem,
        enableImageCycler: true,
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('product-image-cycler-dots')).toBeInTheDocument();
        await expect(canvasElement.querySelectorAll('.product-image img')).toHaveLength(1);

        await userEvent.hover(canvasElement.querySelector('.product-image a')!);
        await waitFor(() => expect(canvasElement.querySelectorAll('.product-image img')).toHaveLength(2));
    },
};
