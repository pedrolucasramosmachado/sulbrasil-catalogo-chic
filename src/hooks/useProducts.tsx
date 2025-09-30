import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  wholesale_price?: number;
  retail_price?: number;
  category: string;
  image_url?: string;
  sizes?: string[];
  is_featured?: boolean;
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
        .order('created_at', { ascending: false });

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

  const getCategoriesWithImages = () => {
    const categories = [...new Set(products.map(p => p.category))];
    return categories.map(category => {
      const firstProduct = products.find(p => p.category === category);
      return {
        category,
        imageUrl: firstProduct?.image_url || '',
      };
    });
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
  };
};