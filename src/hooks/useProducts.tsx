import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  wholesale_price?: number;
  retail_price?: number;
  promotion_wholesale_price?: number | null;
  promotion_retail_price?: number | null;
  category: string;
  subcategory?: string | null;
  image_url?: string;
  sizes?: string[];
  is_featured?: boolean;
  is_promotion?: boolean | null;
  is_launch?: boolean | null;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getProductsByCategory = (category: string) => {
    if (category === 'todos') return products;
    return products.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  };

  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category))];
    return ['todos', ...categories];
  };

  const getFeaturedProducts = () => {
    return products.filter(product => product.is_featured);
  };

  const getPromotionProducts = () => {
    return products.filter(product => product.is_promotion === true);
  };

  const getLaunchProducts = () => {
    return products.filter(product => product.is_launch === true);
  };

  const getCategoriesWithImages = () => {
    const categoriesMap = new Map<string, { imageUrl: string; minWholesale: number | null; minRetail: number | null }>();
    
    // Add "Promoções da Semana" if there are promotion products
    const promoProducts = getPromotionProducts();
    if (promoProducts.length > 0 && promoProducts[0].image_url) {
      const minPromoWholesale = Math.min(...promoProducts.map(p => p.promotion_wholesale_price || p.wholesale_price || Infinity).filter(p => p !== Infinity));
      const minPromoRetail = Math.min(...promoProducts.map(p => p.promotion_retail_price || p.retail_price || Infinity).filter(p => p !== Infinity));
      
      categoriesMap.set('Promoções da Semana 🔥', {
        imageUrl: promoProducts[0].image_url,
        minWholesale: minPromoWholesale === Infinity ? null : minPromoWholesale,
        minRetail: minPromoRetail === Infinity ? null : minPromoRetail,
      });
    }
    
    // Add "Lançamentos" if there are launch products
    const launchProducts = getLaunchProducts();
    if (launchProducts.length > 0 && launchProducts[0].image_url) {
      const minLaunchWholesale = Math.min(...launchProducts.map(p => p.wholesale_price || Infinity).filter(p => p !== Infinity));
      const minLaunchRetail = Math.min(...launchProducts.map(p => p.retail_price || Infinity).filter(p => p !== Infinity));
      
      categoriesMap.set('Lançamentos ✨', {
        imageUrl: launchProducts[0].image_url,
        minWholesale: minLaunchWholesale === Infinity ? null : minLaunchWholesale,
        minRetail: minLaunchRetail === Infinity ? null : minLaunchRetail,
      });
    }
    
    products.forEach(product => {
      if (!categoriesMap.has(product.category)) {
        categoriesMap.set(product.category, {
          imageUrl: product.image_url || '/placeholder.svg',
          minWholesale: product.wholesale_price || null,
          minRetail: product.retail_price || null
        });
      } else {
        const current = categoriesMap.get(product.category)!;
        // Atualizar com o menor preço de atacado
        if (product.wholesale_price && (!current.minWholesale || product.wholesale_price < current.minWholesale)) {
          current.minWholesale = product.wholesale_price;
        }
        // Atualizar com o menor preço de varejo
        if (product.retail_price && (!current.minRetail || product.retail_price < current.minRetail)) {
          current.minRetail = product.retail_price;
        }
      }
    });
    
    return Array.from(categoriesMap.entries()).map(([category, data]) => ({
      category,
      imageUrl: data.imageUrl,
      minWholesalePrice: data.minWholesale,
      minRetailPrice: data.minRetail
    }));
  };

  const getSubcategoriesWithData = (category: string) => {
    const categoryProducts = getProductsByCategory(category);
    const subcategoryMap = new Map<string, { 
      subcategory: string;
      imageUrl: string;
      minWholesale: number | null;
      minRetail: number | null;
    }>();
    
    categoryProducts.forEach(product => {
      if (product.subcategory && product.subcategory !== '') {
        const subcat = product.subcategory;
        if (!subcategoryMap.has(subcat)) {
          subcategoryMap.set(subcat, {
            subcategory: subcat,
            imageUrl: product.image_url || '/placeholder.svg',
            minWholesale: product.wholesale_price || null,
            minRetail: product.retail_price || null
          });
        } else {
          const current = subcategoryMap.get(subcat)!;
          // Atualizar com o menor preço de atacado
          if (product.wholesale_price && (!current.minWholesale || product.wholesale_price < current.minWholesale)) {
            current.minWholesale = product.wholesale_price;
          }
          // Atualizar com o menor preço de varejo
          if (product.retail_price && (!current.minRetail || product.retail_price < current.minRetail)) {
            current.minRetail = product.retail_price;
          }
        }
      }
    });
    
    return Array.from(subcategoryMap.values());
  };

  const getProductsBySubcategory = (category: string, subcategory: string) => {
    return products.filter(product => {
      const categoryMatch = product.category.toLowerCase() === category.toLowerCase();
      const subcategoryMatch = product.subcategory?.toLowerCase() === subcategory.toLowerCase();
      return categoryMatch && subcategoryMatch;
    });
  };

  const categoryHasSubcategories = (category: string) => {
    const categoryProducts = getProductsByCategory(category);
    const hasSubcats = categoryProducts.some(product => 
      product.subcategory && 
      product.subcategory.trim() !== '' && 
      product.subcategory !== null
    );
    console.log(`Category "${category}" has subcategories:`, hasSubcats, categoryProducts.length, 'products');
    return hasSubcats;
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    getProductsByCategory,
    getCategories,
    getFeaturedProducts,
    getCategoriesWithImages,
    getSubcategoriesWithData,
    getProductsBySubcategory,
    categoryHasSubcategories,
    getPromotionProducts,
    getLaunchProducts,
  };
};