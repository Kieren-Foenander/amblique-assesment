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
import type { ShopperProducts } from '@salesforce/storefront-next-runtime/scapi';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useCurrentVariant } from '@/hooks/product/use-current-variant';
import { useSelectedVariations } from '@/hooks/product/use-selected-variations';
import { getDisplayVariationValues } from '@/lib/product-utils';
import { useProductView } from '@/providers/product-view';
import { useStickyActionMode } from '@/components/sticky-action';

interface AddToCartActionProps {
    product: ShopperProducts.schemas['Product'];
    onCartSuccess?: () => void;
    onCartError?: (error: unknown) => void;
}

export default function AddToCartAction({ product, onCartSuccess, onCartError }: AddToCartActionProps) {
    const { t } = useTranslation('product');
    const mode = useStickyActionMode();
    const currentVariant = useCurrentVariant({ product });
    const selectedVariations = useSelectedVariations({ product });
    const { canAddToCart, handleAddToCart, isAddingToOrUpdatingCart, isMasterOrVariantProduct } = useProductView();

    const requiresOptionSelection = isMasterOrVariantProduct && !currentVariant;
    const displayVariations = getDisplayVariationValues(product.variationAttributes, selectedVariations);
    const variationSummary = Object.entries(displayVariations)
        .map(([name, value]) => `${name}: ${value}`)
        .join(' · ');

    const handleClick = async () => {
        try {
            await handleAddToCart();
            onCartSuccess?.();
        } catch (error) {
            onCartError?.(error);
        }
    };

    const button = (
        <Button
            data-testid={mode === 'inline' ? 'add-to-cart' : 'sticky-add-to-cart'}
            onClick={() => void handleClick()}
            disabled={!canAddToCart || isAddingToOrUpdatingCart}
            className={mode === 'inline' ? 'w-full' : 'shrink-0'}
            size="lg">
            {mode === 'sticky' && requiresOptionSelection
                ? t('selectOptions')
                : isAddingToOrUpdatingCart
                  ? t('addingToCart')
                  : t('addToCart')}
        </Button>
    );

    if (mode === 'inline') {
        return button;
    }

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                {variationSummary ? <p className="truncate text-xs text-muted-foreground">{variationSummary}</p> : null}
            </div>
            {button}
        </div>
    );
}
