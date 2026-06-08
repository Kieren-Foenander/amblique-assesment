import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { masterProduct } from '@/components/__mocks__/master-variant-product';
import { standardProd } from '@/components/__mocks__/standard-product-2';
import AddToCartAction from './add-to-cart-action';

const mocks = vi.hoisted(() => ({
    canAddToCart: false,
    currentVariant: undefined as { productId: string } | undefined,
    handleAddToCart: vi.fn(),
    isAddingToOrUpdatingCart: false,
    isMasterOrVariantProduct: true,
    mode: 'sticky' as 'inline' | 'sticky',
    selectedVariations: { color: 'CHARCWL' } as Record<string, string>,
}));

vi.mock('@/components/sticky-action', () => ({
    useStickyActionMode: () => mocks.mode,
}));

vi.mock('@/hooks/product/use-current-variant', () => ({
    useCurrentVariant: () => mocks.currentVariant,
}));

vi.mock('@/hooks/product/use-selected-variations', () => ({
    useSelectedVariations: () => mocks.selectedVariations,
}));

vi.mock('@/providers/product-view', () => ({
    useProductView: () => ({
        canAddToCart: mocks.canAddToCart,
        handleAddToCart: mocks.handleAddToCart,
        isAddingToOrUpdatingCart: mocks.isAddingToOrUpdatingCart,
        isMasterOrVariantProduct: mocks.isMasterOrVariantProduct,
    }),
}));

describe('AddToCartAction', () => {
    beforeEach(() => {
        mocks.canAddToCart = false;
        mocks.currentVariant = undefined;
        mocks.handleAddToCart.mockReset();
        mocks.isAddingToOrUpdatingCart = false;
        mocks.isMasterOrVariantProduct = true;
        mocks.mode = 'sticky';
        mocks.selectedVariations = { color: 'CHARCWL' };
    });

    test('shows selected option labels and prompts for incomplete options in sticky mode', () => {
        render(<AddToCartAction product={masterProduct} />);

        expect(screen.getByText(masterProduct.name || '')).toBeInTheDocument();
        expect(screen.getByText('Color: Charcoal')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Select Options' })).toBeDisabled();
    });

    test('preserves the native Add to Cart label for incomplete options', () => {
        mocks.mode = 'inline';

        render(<AddToCartAction product={masterProduct} />);

        expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeDisabled();
        expect(screen.queryByText(masterProduct.name || '')).not.toBeInTheDocument();
    });

    test('uses the shared add-to-cart handler', async () => {
        const user = userEvent.setup();
        mocks.canAddToCart = true;
        mocks.isMasterOrVariantProduct = false;
        mocks.selectedVariations = {};

        render(<AddToCartAction product={standardProd} />);
        await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(mocks.handleAddToCart).toHaveBeenCalledOnce();
    });
});
