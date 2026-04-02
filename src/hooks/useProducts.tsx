import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImageUrl } from '@/lib/url';

export interface Product {
  id: string;
  name: string;
  description?: string;
  wholesale_price?: number;
  retail_price?: number;
  promotion_wholesale_price?: number | null;
  promotion_retail_price?: number | null;
  category: string;
  category_id?: string | null;
  subcategory?: string | null;
  image_url?: string;
  sizes?: string[];
  is_featured?: boolean;
  is_promotion?: boolean | null;
  is_launch?: boolean | null;
  is_out_of_stock?: boolean | null;
  weight_kg?: number | null;
  display_emoji?: string | null;
  model_name?: string | null;
  color_name?: string | null;
  is_kit?: boolean | null;
  kit_piece_count?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface CategoryOrder {
  id: string;
  name: string;
  display_order: number;
  cover_image_url?: string | null;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryOrders, setCategoryOrders] = useState<CategoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 1000;

  const fetchProducts = async (isInitial = true, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const currentPage = isInitial ? 0 : page + 1;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, wholesale_price, retail_price, promotion_wholesale_price, promotion_retail_price, category, subcategory, image_url, sizes, is_featured, is_promotion, is_launch, is_out_of_stock, created_at, weight_kg, color_name, model_name, display_emoji, is_kit, kit_piece_count')
          .range(from, to)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name, display_order, cover_image_url')
          .order('display_order', { ascending: true })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const newProducts = productsRes.data || [];
      const newCategories = categoriesRes.data || [];

      if (isInitial) {
        setProducts(newProducts);
        setPage(0);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(currentPage);
      }
      
      setHasMore(newProducts.length === PAGE_SIZE);
      setCategoryOrders(newCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(false);
    }
  };

  const getProductsByCategory = (categoryOrId: string) => {
    const categoryProducts = categoryOrId === 'todos' ? products : products.filter(p => 
      p.category_id === categoryOrId || 
      p.category.toLowerCase() === categoryOrId.toLowerCase()
    );
    return categoryProducts.filter(p => !p.is_out_of_stock);
  };

  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category))];
    return ['todos', ...categories];
  };

  const getFeaturedProducts = () => {
    return products.filter(product => product.is_featured && !product.is_out_of_stock);
  };

  const getPromotionProducts = () => {
    return products.filter(product => product.is_promotion === true && !product.is_out_of_stock);
  };

  const getLaunchProducts = () => {
    return products.filter(product => product.is_launch === true && !product.is_out_of_stock);
  };

  const getLatestProduct = () => {
    const availableProducts = products.filter(p => !p.is_out_of_stock && p.image_url);
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
      if (!productCategory || product.is_out_of_stock) return;
      
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

      // If no manual cover, use the first product image found
      if (!data.manualCover && !data.imageUrl && product.image_url) {
        data.imageUrl = product.image_url;
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
      !p.is_out_of_stock
    );
  };

  const categoryHasSubcategories = (categoryOrId: string) => {
    return products.some(p => 
      (p.category_id === categoryOrId || p.category.toLowerCase() === categoryOrId.toLowerCase()) && 
      p.subcategory && 
      p.subcategory.trim() !== '' &&
      !p.is_out_of_stock
    );
  };

  const getProductById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Product;
    } catch (err) {
      console.error('Error fetching product details:', err);
      return null;
    }
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
