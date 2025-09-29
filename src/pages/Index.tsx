import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { toast } from "@/hooks/use-toast";
import { Product, useProducts } from "@/hooks/useProducts";

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  
  const { products, loading, error, getProductsByCategory, getCategories } = useProducts();

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6">
              Sulbrasil Fashion
            </h1>
            <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
              Descubra nossa coleção exclusiva com {products.length} produtos únicos
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">

          {/* Category Filter */}
          {!loading && products.length > 0 && (
            <div className="mb-12 flex justify-center">
              <div className="flex gap-4 flex-wrap justify-center p-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-card-border shadow-soft">
                {getCategories().map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-medium ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-glow'
                        : 'bg-white/80 text-foreground-muted hover:bg-white hover:text-foreground border border-border-subtle'
                    }`}
                  >
                    {category === 'todos' ? '✨ Todos' : `👗 ${category}`}
                  </button>
                ))}
              </div>
            </div>
          )}

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
