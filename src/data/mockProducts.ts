import { Product } from "@/hooks/useProducts";

export const mockProducts: Product[] = [
  // This file is now deprecated - products will come from Supabase
  // Keeping it for backward compatibility during transition
];

// Função para filtrar produtos - now handled by useProducts hook
export const getProductsByCategory = (category: string): Product[] => {
  return mockProducts;
};

// Função para buscar produtos - now handled by useProducts hook  
export const searchProducts = (query: string): Product[] => {
  return mockProducts;
};

// Função para filtrar por cor e preço - now handled by useProducts hook
export const filterProducts = (
  products: Product[], 
  colors: string[], 
  priceRange: [number, number],
  sortBy: string
): Product[] => {
  return products;
};
