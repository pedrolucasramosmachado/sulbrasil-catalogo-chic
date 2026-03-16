import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts, Product } from "@/hooks/useProducts";

// Remove acentos para busca
const removeAccents = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface SearchBarProps {
  onSearchResults?: (results: Product[], query: string) => void;
}

export const SearchBar = ({ onSearchResults }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const { products } = useProducts();

  const filteredProducts = query.length >= 2
    ? products.filter((product) => {
        const normalizedQuery = removeAccents(query.toLowerCase());
        const nameMatch = removeAccents(product.name.toLowerCase()).includes(normalizedQuery);
        const categoryMatch = removeAccents(product.category.toLowerCase()).includes(normalizedQuery);
        return nameMatch || categoryMatch;
      })
    : [];

  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(filteredProducts, query);
    }
  }, [query, filteredProducts.length]);

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className="relative flex-1 max-w-xs sm:max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
