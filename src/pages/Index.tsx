import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters, FilterState } from "@/components/ProductFilters";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Product, useProducts } from "@/hooks/useProducts";
import { Grid3X3, List, ArrowUp } from "lucide-react";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const { products, loading, error, getProductsByCategory, getCategories } = useProducts();
  
  const [filters, setFilters] = useState<FilterState>({
    colors: [],
    priceRange: [0, 300],
    sortBy: "name"
  });

  // Get products based on category and filters
  const displayProducts = useMemo(() => {
    const categoryProducts = getProductsByCategory(selectedCategory);
    return filterProducts(categoryProducts, filters.colors, filters.priceRange, filters.sortBy);
  }, [selectedCategory, filters, products]);

  const filterProducts = (products: Product[], colors: string[], priceRange: [number, number], sortBy: string) => {
    let filtered = [...products];

    // Filter by price range
    filtered = filtered.filter(product => {
      const price = product.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const categories = getCategories();

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Scroll to products section smoothly
    setTimeout(() => {
      const element = document.getElementById('products-section');
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleConsult = (product: Product) => {
    const message = `Olá! Tenho interesse no produto: ${product.name}. Gostaria de mais informações sobre disponibilidade, cores e condições de compra.`;
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: `Consulta sobre: ${product.name}`,
    });
  };

  const handleToggleFavorite = (productId: string) => {
    // In a real app, this would update the backend
    toast({
      title: "Favorito atualizado",
      description: "Produto adicionado/removido dos favoritos",
    });
  };

  const handleExploreProducts = () => {
    const element = document.getElementById('products-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle scroll for showing back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
        cartItemsCount={3}
        categories={categories}
      />

      {/* Hero Section - only show when showing all products */}
      {selectedCategory === "todos" && (
        <HeroSection onExploreProducts={handleExploreProducts} />
      )}

      {/* Products Section */}
      <section id="products-section" className="py-12">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {selectedCategory === "todos" ? "Todos os Produtos" : selectedCategory}
                </h2>
                <p className="text-foreground-muted">
                  {displayProducts.length} produtos encontrados
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Filters */}
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={displayProducts.length}
            />

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-16">
                  <div className="text-2xl mb-4">Carregando produtos...</div>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
                </div>
               ) : displayProducts.length > 0 ? (
                 <div className={`grid gap-6 ${
                   viewMode === "grid" 
                     ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                     : "grid-cols-1"
                 }`}>
                   {displayProducts.map((product) => (
                     <ProductCard
                       key={product.id}
                       product={product}
                       onViewDetails={handleViewDetails}
                       onConsult={handleConsult}
                       onToggleFavorite={handleToggleFavorite}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-16">
                   <div className="mb-4 text-6xl opacity-20">🔍</div>
                   <h3 className="text-xl font-semibold text-foreground mb-2">
                     Nenhum produto encontrado
                   </h3>
                   <p className="text-foreground-muted mb-4">
                     Tente ajustar seus filtros ou explore outras categorias
                   </p>
                   <Button
                     variant="outline"
                     onClick={() => {
                       setFilters({ colors: [], priceRange: [0, 300], sortBy: "name" });
                       setSelectedCategory("todos");
                     }}
                   >
                     Limpar Filtros
                   </Button>
                 </div>
               )}
             </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onConsult={handleConsult}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-strong w-12 h-12"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default Index;
