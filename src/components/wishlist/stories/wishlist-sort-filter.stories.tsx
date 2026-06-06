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

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { action } from 'storybook/actions';
import { WishlistSortFilter, type WishlistSortOption, type WishlistFilterOption } from '../wishlist-sort-filter';

const meta: Meta<typeof WishlistSortFilter> = {
    title: 'ACCOUNT/Wishlist Sort Filter',
    component: WishlistSortFilter,
    tags: ['autodocs', 'interaction'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
Sort and filter controls for the My Wishlist page.

**Features:**
- Sort by: Recently Added (default), Name (A-Z), Price: Low to High, Price: High to Low
- Filter by: All Items (default), In Stock, Out of Stock, On Sale
- All logic is client-side — the API does not support server-side sort/filter

**Usage:** Rendered above the wishlist item list when the wishlist is non-empty.
                `,
            },
        },
    },
    argTypes: {
        onSortChange: { action: 'sortChange' },
        onFilterChange: { action: 'filterChange' },
    },
};

export default meta;
type Story = StoryObj<typeof WishlistSortFilter>;

export const Default: Story = {
    name: 'Default (recently added / all items)',
    args: {
        sortValue: 'recently-added',
        filterValue: 'all',
        onSortChange: action('onSortChange'),
        onFilterChange: action('onFilterChange'),
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        const selects = canvas.getAllByRole('combobox');
        await expect(selects).toHaveLength(2);

        // Sort select defaults to recently-added
        await expect(selects[0]).toHaveValue('recently-added');
        // Filter select defaults to all
        await expect(selects[1]).toHaveValue('all');
    },
};

export const SortByNameAZ: Story = {
    name: 'Sort: Name (A-Z)',
    args: {
        sortValue: 'name-asc',
        filterValue: 'all',
        onSortChange: action('onSortChange'),
        onFilterChange: action('onFilterChange'),
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        const selects = canvas.getAllByRole('combobox');
        await expect(selects[0]).toHaveValue('name-asc');
        await expect(selects[1]).toHaveValue('all');
    },
};

export const SortByPriceLow: Story = {
    name: 'Sort: Price Low to High',
    args: {
        sortValue: 'price-low',
        filterValue: 'all',
        onSortChange: action('onSortChange'),
        onFilterChange: action('onFilterChange'),
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        const selects = canvas.getAllByRole('combobox');
        await expect(selects[0]).toHaveValue('price-low');
    },
};

export const FilterInStock: Story = {
    name: 'Filter: In Stock',
    args: {
        sortValue: 'recently-added',
        filterValue: 'in-stock',
        onSortChange: action('onSortChange'),
        onFilterChange: action('onFilterChange'),
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        const selects = canvas.getAllByRole('combobox');
        await expect(selects[1]).toHaveValue('in-stock');
    },
};

export const FilterOnSale: Story = {
    name: 'Filter: On Sale',
    args: {
        sortValue: 'recently-added',
        filterValue: 'on-sale',
        onSortChange: action('onSortChange'),
        onFilterChange: action('onFilterChange'),
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        const selects = canvas.getAllByRole('combobox');
        await expect(selects[1]).toHaveValue('on-sale');
    },
};

/**
 * Stateful wrapper for interaction stories — WishlistSortFilter is a controlled
 * component, so we need local state for the select values to actually update
 * when the play function changes them.
 */
function StatefulSortFilter(props: React.ComponentProps<typeof WishlistSortFilter>) {
    const [sortValue, setSortValue] = useState<WishlistSortOption>(props.sortValue);
    const [filterValue, setFilterValue] = useState<WishlistFilterOption>(props.filterValue);
    return (
        <WishlistSortFilter
            {...props}
            sortValue={sortValue}
            filterValue={filterValue}
            onSortChange={(v) => {
                setSortValue(v);
                props.onSortChange(v);
            }}
            onFilterChange={(v) => {
                setFilterValue(v);
                props.onFilterChange(v);
            }}
        />
    );
}

export const SortInteraction: Story = {
    name: 'Interaction: change sort option',
    render: (args) => <StatefulSortFilter {...args} />,
    args: {
        sortValue: 'recently-added',
        filterValue: 'all',
        onSortChange: action('onSortChange'),
        onFilterChange: action('onFilterChange'),
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        const selects = canvas.getAllByRole('combobox');
        await userEvent.selectOptions(selects[0], 'price-high');
        await expect(selects[0]).toHaveValue('price-high');
    },
};

export const FilterInteraction: Story = {
    name: 'Interaction: change filter option',
    render: (args) => <StatefulSortFilter {...args} />,
    args: {
        sortValue: 'recently-added',
        filterValue: 'all',
        onSortChange: action('onSortChange'),
        onFilterChange: action('onFilterChange'),
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        const selects = canvas.getAllByRole('combobox');
        await userEvent.selectOptions(selects[1], 'out-of-stock');
        await expect(selects[1]).toHaveValue('out-of-stock');
    },
};
