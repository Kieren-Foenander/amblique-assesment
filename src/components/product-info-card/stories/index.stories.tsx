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
import { expect, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { action } from 'storybook/actions';
import { CalendarDays, Truck, RotateCcw } from 'lucide-react';
import ProductInfoCard from '../index';

const meta: Meta<typeof ProductInfoCard> = {
    title: 'Components/ProductInfoCard',
    component: ProductInfoCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    decorators: [
        (Story) => (
            <div className="max-w-md p-6">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ProductInfoCard>;

export const Default: Story = {
    args: {
        icon: <CalendarDays className="h-5 w-5" />,
        title: 'Estimated Delivery',
        description: 'Sep 15-16 · Shipping options available',
        action: { label: 'Learn More', onClick: action('learn more clicked') },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        await expect(canvas.getByText('Estimated Delivery')).toBeInTheDocument();
        await expect(canvas.getByText('Sep 15-16 · Shipping options available')).toBeInTheDocument();
        const button = canvas.getByRole('button', { name: /learn more - estimated delivery/i });
        await expect(button).toBeInTheDocument();
    },
};

export const WithoutAction: Story = {
    args: {
        icon: <Truck className="h-5 w-5" />,
        title: 'Free Shipping',
        description: 'On orders over $50',
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        await expect(canvas.getByText('Free Shipping')).toBeInTheDocument();
        await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    },
};

export const TitleOnly: Story = {
    args: {
        icon: <RotateCcw className="h-5 w-5" />,
        title: 'Free Returns',
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        await expect(canvas.getByText('Free Returns')).toBeInTheDocument();
    },
};
