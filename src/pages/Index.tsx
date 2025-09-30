import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Product, useProducts } from "@/hooks/useProducts";

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  
  const { products, loading, error, getProductsByCategory, getCategoriesWithImages } = useProducts();

  // Deep linking - abrir produto específico via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('produto');
    
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setIsModalOpen(true);
        // Limpar URL sem recarregar a página
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [products]);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };


  const handleConsult = (product: Product) => {
    const productUrl = `${window.location.origin}/?produto=${product.id}`;
    const message = `Olá! Tenho interesse no produto: ${product.name}. Link do produto: ${productUrl}. Gostaria de mais informações sobre disponibilidade, cores e condições de compra.`;
    const whatsappUrl = `https://wa.me/5511961890347?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: `Consulta sobre: ${product.name}`,
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowCategorySelection(false);
  };

  const handleBackToCategories = () => {
    setShowCategorySelection(true);
    setSelectedCategory('todos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header />

      {/* Quiz Section - Category Selection */}
      {showCategorySelection ? (
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6">
                Qual categoria deseja visualizar?
              </h1>
              <p className="text-xl text-foreground-muted leading-relaxed">
                Escolha uma categoria para ver todas as cores disponíveis
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-6"></div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="text-2xl mb-4">Carregando categorias...</div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
              </div>
            ) : (
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                {getCategoriesWithImages().map((item, index) => (
                  <div 
                    key={item.category}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <CategoryCard
                      category={item.category}
                      imageUrl={item.imageUrl}
                      onSelect={() => handleCategorySelect(item.category)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Hero Section - Products View */}
          <section className="relative py-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center max-w-3xl mx-auto">
                <Button
                  onClick={handleBackToCategories}
                  variant="outline"
                  className="mb-8 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar às categorias
                </Button>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6">
                  {selectedCategory}
                </h1>
                <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
                  Descubra as cores disponíveis nesta categoria
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
              </div>
            </div>
          </section>

          {/* Products Section */}
          <section className="py-16 relative">
            <div className="container mx-auto px-4">
              {loading ? (
                <div className="text-center py-16">
                  <div className="text-2xl mb-4">Carregando produtos...</div>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
                </div>
              ) : products.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                  {getProductsByCategory(selectedCategory).map((product, index) => (
                    <div 
                      key={product.id} 
                      className="flex animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ProductCard
                        product={product}
                        onViewDetails={handleViewDetails}
                        onConsult={handleConsult}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mb-4 text-6xl opacity-20">📦</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-foreground-muted">
                    Em breve teremos produtos disponíveis
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onConsult={handleConsult}
      />
    </div>
  );
};

export default Index;
