import { useProductContext } from '@/contexts/ProductContext';
import { optimizeImageUrl } from '@/lib/url';

export type { Product, CategoryOrder } from '@/contexts/ProductContext';

export const useProducts = () => {
  const {
    products,
    categoryOrders,
    showOutOfStock,
    loading,
    error,
    hasMore,
    fetchProducts,
    loadMore,
    getProductById,
  } = useProductContext();

  const getProductsByCategory = (categoryOrId: string) => {
    const categoryProducts = categoryOrId === 'todos' ? products : products.filter(p => 
      p.category_id === categoryOrId || 
      p.category.toLowerCase() === categoryOrId.toLowerCase()
    );
    
    // Sort logic to prioritize "Diana" as requested
    const filtered = categoryProducts.filter(p => !p.is_out_of_stock || showOutOfStock);
    return [...filtered].sort((a, b) => {
      const isADiana = a.name.toLowerCase().includes('diana');
      const isBDiana = b.name.toLowerCase().includes('diana');
      if (isADiana && !isBDiana) return -1;
      if (!isADiana && isBDiana) return 1;
      return 0;
    });
  };

  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category))];
    return ['todos', ...categories];
  };

  const getFeaturedProducts = () => {
    return products.filter(product => product.is_featured && (!product.is_out_of_stock || showOutOfStock));
  };

  const getPromotionProducts = () => {
    return products.filter(product => product.is_promotion === true && (!product.is_out_of_stock || showOutOfStock));
  };

  const getLaunchProducts = () => {
    const launchItems = products.filter(product => product.is_launch === true && (!product.is_out_of_stock || showOutOfStock));
    // Ordena por ordem de criação (mais recentes primeiro)
    return [...launchItems].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  };

  const getLatestProduct = () => {
    const availableProducts = products.filter(p => (!p.is_out_of_stock || showOutOfStock) && p.image_url);
    if (availableProducts.length === 0) return null;
    
    return [...availableProducts].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    })[0];
  };

  const getCategoriesWithImages = () => {
    const categoriesWithData = new Map<string, { 
      minWholesale: number; 
      minRetail: number; 
      imageUrl?: string;
      manualCover?: string | null;
    }>();

    // First, populate from categoryOrders (manual configuration)
    categoryOrders.forEach(cat => {
      const name = cat.name.trim();
      categoriesWithData.set(name, {
        minWholesale: Infinity,
        minRetail: Infinity,
        manualCover: cat.cover_image_url,
        imageUrl: cat.cover_image_url || undefined
      });
    });

    // Then, aggregate data from products
    products.forEach((product) => {
      const productCategory = product.category?.trim();
      if (!productCategory || (product.is_out_of_stock && !showOutOfStock)) return;
      
      let data = categoriesWithData.get(productCategory);
      
      if (!data) {
        data = { minWholesale: Infinity, minRetail: Infinity };
        categoriesWithData.set(productCategory, data);
      }

      // Track prices
      const wPrice = (product.is_promotion && product.promotion_wholesale_price) ? product.promotion_wholesale_price : (product.wholesale_price || 0);
      const rPrice = (product.is_promotion && product.promotion_retail_price) ? product.promotion_retail_price : (product.retail_price || 0);
      
      if (wPrice > 0 && wPrice < data.minWholesale) data.minWholesale = wPrice;
      if (rPrice > 0 && rPrice < data.minRetail) data.minRetail = rPrice;

      // If no manual cover, select image. Prioritize "Diana" as requested.
      if (!data.manualCover && product.image_url) {
        const isDiana = product.name.toLowerCase().includes('diana');
        if (!data.imageUrl || isDiana) {
          // If we find a "Diana" product, it becomes the priority cover
          if (isDiana) {
            data.imageUrl = product.image_url;
          } else if (!data.imageUrl) {
            // Otherwise, only set if no image has been set yet
            data.imageUrl = product.image_url;
          }
        }
      }
    });

    // Build the final list
    const result = Array.from(categoriesWithData.entries())
      .filter(([_, data]) => data.minWholesale !== Infinity || data.minRetail !== Infinity) // Only show if has products in stock
      .map(([category, data]) => ({
        category,
        minWholesalePrice: data.minWholesale === Infinity ? 0 : data.minWholesale,
        minRetailPrice: data.minRetail === Infinity ? 0 : data.minRetail,
        imageUrl: data.imageUrl || '/placeholder.svg',
        displayOrder: categoryOrders.find(c => c.name.trim() === category)?.display_order ?? 999
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Add Special Categories (Promotions and Launches)
    const promoProducts = getPromotionProducts();
    if (promoProducts.length > 0) {
      const promoConfig = categoryOrders.find(c => ["promoções da semana", "promoções"].includes(c.name.trim().toLowerCase()));
      result.unshift({
        category: "Promoções da Semana",
        minWholesalePrice: Math.min(...promoProducts.map(p => p.promotion_wholesale_price || p.wholesale_price || Infinity).filter(p => p !== Infinity)),
        minRetailPrice: Math.min(...promoProducts.map(p => p.promotion_retail_price || p.retail_price || Infinity).filter(p => p !== Infinity)),
        imageUrl: promoConfig?.cover_image_url || promoProducts[0].image_url || '/placeholder.svg',
        displayOrder: -2
      });
    }

    const launchProducts = getLaunchProducts();
    if (launchProducts.length > 0) {
      const launchConfig = categoryOrders.find(c => c.name.trim().toLowerCase() === "lançamentos");
      result.unshift({
        category: "Lançamentos",
        minWholesalePrice: Math.min(...launchProducts.map(p => p.wholesale_price || Infinity).filter(p => p !== Infinity)),
        minRetailPrice: Math.min(...launchProducts.map(p => p.retail_price || Infinity).filter(p => p !== Infinity)),
        imageUrl: launchConfig?.cover_image_url || launchProducts[0].image_url || '/placeholder.svg',
        displayOrder: -1
      });
    }

    return result;
  };

  const getSubcategoriesWithData = (categoryOrId: string) => {
    const categoryProducts = getProductsByCategory(categoryOrId);
    const subcategoryMap = new Map<string, { 
      subcategory: string;
      imageUrl: string;
      minWholesale: number | null;
      minRetail: number | null;
    }>();
    
    categoryProducts.forEach(product => {
      if (product.subcategory && product.subcategory.trim() !== '') {
        const subcat = product.subcategory.trim();
        const productImg = product.image_url;
        const hasValidImage = productImg && productImg.trim() !== '' && productImg !== '/placeholder.svg';

        if (!subcategoryMap.has(subcat)) {
          subcategoryMap.set(subcat, {
            subcategory: subcat,
            imageUrl: hasValidImage ? productImg! : '/placeholder.svg',
            minWholesale: product.wholesale_price || null,
            minRetail: product.retail_price || null
          });
        } else {
          const current = subcategoryMap.get(subcat)!;
          // Se a imagem atual for placeholder e o produto atual tiver uma imagem real, atualiza
          if (current.imageUrl === '/placeholder.svg' && hasValidImage) {
            current.imageUrl = productImg!;
          }
          if (product.wholesale_price && (!current.minWholesale || product.wholesale_price < current.minWholesale)) {
            current.minWholesale = product.wholesale_price;
          }
          if (product.retail_price && (!current.minRetail || product.retail_price < current.minRetail)) {
            current.minRetail = product.retail_price;
          }
        }
      }
    });

    return Array.from(subcategoryMap.values());
  };

  const getProductsBySubcategory = (categoryOrId: string, subcategory: string) => {
    return products.filter(p => 
      (p.category_id === categoryOrId || p.category.toLowerCase() === categoryOrId.toLowerCase()) && 
      p.subcategory === subcategory &&
      (!p.is_out_of_stock || showOutOfStock)
    );
  };

  const categoryHasSubcategories = (categoryOrId: string) => {
    return products.some(p => 
      (p.category_id === categoryOrId || p.category.toLowerCase() === categoryOrId.toLowerCase()) && 
      p.subcategory && 
      p.subcategory.trim() !== '' &&
      (!p.is_out_of_stock || showOutOfStock)
    );
  };

  return {
    products,
    loading,
    hasMore,
    error,
    fetchProducts,
    loadMore,
    getProductById,
    getProductsByCategory,
    getCategories,
    getFeaturedProducts,
    getPromotionProducts,
    getLaunchProducts,
    getLatestProduct,
    getCategoriesWithImages,
    getSubcategoriesWithData,
    getProductsBySubcategory,
    categoryHasSubcategories,
    categoryOrders,
  };
};
