import React, { createContext, useContext, useState, useEffect } from 'react';
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

export interface Sector {
  id: string;
  name: string;
  display_order: number;
}

export interface CategoryOrder {
  id: string;
  name: string;
  display_order: number;
  cover_image_url?: string | null;
  sector_id?: string | null;
  subcategory_order?: string[] | null;
}

interface ProductContextType {
  products: Product[];
  categoryOrders: CategoryOrder[];
  sectors: Sector[];
  showOutOfStock: boolean;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  fetchProducts: (isInitial?: boolean, silent?: boolean) => Promise<void>;
  loadMore: () => void;
  getProductById: (id: string) => Promise<Product | null>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PAGE_SIZE = 1000;

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryOrders, setCategoryOrders] = useState<CategoryOrder[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchProducts = async (isInitial = true, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const currentPage = isInitial ? 0 : page + 1;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const [productsRes, categoriesRes, settingsRes, sectorsRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, wholesale_price, retail_price, promotion_wholesale_price, promotion_retail_price, category, subcategory, image_url, sizes, is_featured, is_promotion, is_launch, is_out_of_stock, created_at, weight_kg, color_name, model_name, display_emoji, is_kit, kit_piece_count')
          .range(from, to)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name, display_order, cover_image_url, sector_id, subcategory_order')
          .order('display_order', { ascending: true }),
        supabase
          .from('whatsapp_settings')
          .select('show_out_of_stock')
          .maybeSingle(),
        supabase
          .from('sectors')
          .select('id, name, display_order')
          .order('display_order', { ascending: true })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const newProducts = productsRes.data || [];
      const newCategories = categoriesRes.data || [];
      const newSectors = sectorsRes && !sectorsRes.error ? sectorsRes.data || [] : [];
      
      if (settingsRes && !settingsRes.error && settingsRes.data) {
        setShowOutOfStock(settingsRes.data.show_out_of_stock);
      }

      if (isInitial) {
        setProducts(newProducts);
        setPage(0);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(currentPage);
      }
      
      setHasMore(newProducts.length === PAGE_SIZE);
      setCategoryOrders(newCategories);
      setSectors(newSectors);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar produtos/categorias do Supabase:', err);
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

  const getProductById = async (id: string) => {
    // Primeiro tenta buscar na memória cache local
    const found = products.find(p => p.id === id);
    if (found) return found;

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

  return (
    <ProductContext.Provider value={{
      products,
      categoryOrders,
      sectors,
      showOutOfStock,
      loading,
      error,
      hasMore,
      page,
      fetchProducts,
      loadMore,
      getProductById
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext deve ser usado dentro de um ProductProvider');
  }
  return context;
};
