import { Product } from "@/components/ProductCard";
import blusaImg from "@/assets/product-blusa-1.jpg";
import vestidoImg from "@/assets/product-vestido-1.jpg";
import calcaImg from "@/assets/product-calca-1.jpg";

export const mockProducts: Product[] = [
  // Blusas e Camisetas
  {
    id: "1",
    name: "Blusa Feminina Básica Premium",
    image: blusaImg,
    colors: ["Branco", "Preto", "Rosa", "Azul"],
    retailPrice: 89.90,
    wholesalePrice: 65.00,
    category: "Blusas e Camisetas",
    isNew: true,
    isFavorite: false
  },
  {
    id: "2", 
    name: "Camiseta Gola V Comfort",
    image: blusaImg,
    colors: ["Cinza", "Marinho", "Off-white", "Verde"],
    retailPrice: 75.90,
    wholesalePrice: 55.00,
    category: "Blusas e Camisetas",
    isNew: false,
    isFavorite: true
  },
  {
    id: "3",
    name: "Blusa Manga Longa Elegante",
    image: blusaImg,
    colors: ["Vinho", "Mostarda", "Preto", "Caramelo"],
    retailPrice: 109.90,
    wholesalePrice: 79.00,
    category: "Blusas e Camisetas",
    isNew: false,
    isFavorite: false
  },

  // Vestidos
  {
    id: "4",
    name: "Vestido Midi Floral Primavera",
    image: vestidoImg,
    colors: ["Azul Floral", "Rosa Floral", "Verde Floral"],
    retailPrice: 149.90,
    wholesalePrice: 109.00,
    category: "Vestidos",
    isNew: true,
    isFavorite: false
  },
  {
    id: "5",
    name: "Vestido Longo Festa Elegante",
    image: vestidoImg,
    colors: ["Preto", "Azul Marinho", "Bordô", "Verde Esmeralda"],
    retailPrice: 199.90,
    wholesalePrice: 145.00,
    category: "Vestidos",
    isNew: false,
    isFavorite: true
  },
  {
    id: "6",
    name: "Vestido Curto Casual Verão",
    image: vestidoImg,
    colors: ["Amarelo", "Coral", "Turquesa", "Branco"],
    retailPrice: 119.90,
    wholesalePrice: 89.00,
    category: "Vestidos",
    isNew: false,
    isFavorite: false
  },

  // Calças
  {
    id: "7",
    name: "Calça Skinny High Waist",
    image: calcaImg,
    colors: ["Preto", "Azul Escuro", "Cinza", "Camel"],
    retailPrice: 129.90,
    wholesalePrice: 95.00,
    category: "Calças",
    isNew: false,
    isFavorite: false
  },
  {
    id: "8",
    name: "Calça Wide Leg Moderna",
    image: calcaImg,
    colors: ["Off-white", "Bege", "Terracota", "Olive"],
    retailPrice: 159.90,
    wholesalePrice: 115.00,
    category: "Calças",
    isNew: true,
    isFavorite: false
  },
  {
    id: "9",
    name: "Legging Fitness Premium",
    image: calcaImg,
    colors: ["Preto", "Cinza Mescla", "Azul Marinho", "Vinho"],
    retailPrice: 89.90,
    wholesalePrice: 65.00,
    category: "Calças",
    isNew: false,
    isFavorite: true
  },

  // Shorts
  {
    id: "10",
    name: "Short Jeans Destroyed Trend",
    image: calcaImg,
    colors: ["Azul Claro", "Azul Médio", "Azul Escuro"],
    retailPrice: 99.90,
    wholesalePrice: 72.00,
    category: "Shorts",
    isNew: true,
    isFavorite: false
  },
  {
    id: "11",
    name: "Short Alfaiataria Elegante",
    image: calcaImg,
    colors: ["Preto", "Camel", "Rosa Claro", "Branco"],
    retailPrice: 119.90,
    wholesalePrice: 87.00,
    category: "Shorts",
    isNew: false,
    isFavorite: false
  },

  // Conjuntos
  {
    id: "12",
    name: "Conjunto Moletom Comfort Style",
    image: blusaImg,
    colors: ["Cinza Mescla", "Rosa Claro", "Caramelo", "Verde Sage"],
    retailPrice: 189.90,
    wholesalePrice: 139.00,
    category: "Conjuntos",
    isNew: true,
    isFavorite: false
  },
  {
    id: "13",
    name: "Conjunto Blazer + Saia Social",
    image: vestidoImg,
    colors: ["Preto", "Marinho", "Camel", "Off-white"],
    retailPrice: 259.90,
    wholesalePrice: 189.00,
    category: "Conjuntos",
    isNew: false,
    isFavorite: true
  },

  // Listradas e Estonadas
  {
    id: "14",
    name: "Blusa Listrada Navy Style",
    image: blusaImg,
    colors: ["Azul/Branco", "Preto/Branco", "Vermelho/Branco"],
    retailPrice: 95.90,
    wholesalePrice: 69.00,
    category: "Listradas e Estonadas",
    isNew: false,
    isFavorite: false
  },
  {
    id: "15",
    name: "Vestido Estonado Tie-Dye",
    image: vestidoImg,
    colors: ["Azul Estonado", "Rosa Estonado", "Verde Estonado"],
    retailPrice: 139.90,
    wholesalePrice: 102.00,
    category: "Listradas e Estonadas",
    isNew: true,
    isFavorite: false
  },
  {
    id: "16",
    name: "Camiseta Listras Assimétricas",
    image: blusaImg,
    colors: ["Preto/Cinza", "Azul/Branco", "Rosa/Branco", "Verde/Branco"],
    retailPrice: 79.90,
    wholesalePrice: 58.00,
    category: "Listradas e Estonadas",
    isNew: false,
    isFavorite: true
  }
];

// Função para filtrar produtos
export const getProductsByCategory = (category: string): Product[] => {
  if (!category) return mockProducts;
  return mockProducts.filter(product => product.category === category);
};

// Função para buscar produtos
export const searchProducts = (query: string): Product[] => {
  if (!query) return mockProducts;
  const lowercaseQuery = query.toLowerCase();
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.colors.some(color => color.toLowerCase().includes(lowercaseQuery)) ||
    product.category.toLowerCase().includes(lowercaseQuery)
  );
};

// Função para filtrar por cor e preço
export const filterProducts = (
  products: Product[], 
  colors: string[], 
  priceRange: [number, number],
  sortBy: string
): Product[] => {
  let filtered = [...products];

  // Filtrar por cores
  if (colors.length > 0) {
    filtered = filtered.filter(product =>
      product.colors.some(color => colors.includes(color))
    );
  }

  // Filtrar por preço (usando preço de varejo)
  filtered = filtered.filter(product =>
    product.retailPrice >= priceRange[0] && product.retailPrice <= priceRange[1]
  );

  // Ordenar
  switch (sortBy) {
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "price-low":
      filtered.sort((a, b) => a.retailPrice - b.retailPrice);
      break;
    case "price-high":
      filtered.sort((a, b) => b.retailPrice - a.retailPrice);
      break;
    case "newest":
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
  }

  return filtered;
};