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
