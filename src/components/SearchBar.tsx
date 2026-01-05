import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";

// Remove acentos para busca
const removeAccents = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { products } = useProducts();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = query.length >= 2
    ? products.filter((product) =>
        removeAccents(product.name.toLowerCase()).includes(
          removeAccents(query.toLowerCase())
        )
      )
    : [];

  const handleSelectProduct = (product: typeof products[0]) => {
    setQuery("");
    setIsOpen(false);
    navigate(`/catalogo/${encodeURIComponent(product.category)}`);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs sm:max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
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

      {/* Dropdown de resultados */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            <ul className="py-1">
              {filteredProducts.map((product) => (
                <li key={product.id}>
                  <button
                    onClick={() => handleSelectProduct(product)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    )}
                    <span className="text-sm font-medium truncate">{product.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Nenhum produto encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};
