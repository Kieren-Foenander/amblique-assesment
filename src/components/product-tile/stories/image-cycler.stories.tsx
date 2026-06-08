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
