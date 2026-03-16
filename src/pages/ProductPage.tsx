import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, MessageCircle, ShoppingCart, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById } = useProducts();
  const { addItem } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [justAdded, setJustAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(true);

  useEffect(() => {
    const fetchFullDetails = async () => {
      if (id) {
        setFetchingDetails(true);
        const fullProduct = await getProductById(id);
        setProduct(fullProduct);
        setFetchingDetails(false);
      }
    };
    fetchFullDetails();
  }, [id]);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes && product.sizes.length === 1 ? product.sizes[0] : undefined);
    }
  }, [product]);

  const extraPrice = (selectedSize === 'G1' && product?.category?.toLowerCase() === 'conjuntos') ? 10 : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name}${selectedSize ? ` - Tam: ${selectedSize}` : ""}`,
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleConsult = () => {
    if (!product) return;
    const productUrl = window.location.href;
    const message = `Olá! Tenho interesse no produto: ${product.name}. Link do produto: ${productUrl}. Gostaria de mais informações sobre disponibilidade, cores e condições de compra.`;
    const whatsappUrl = `https://wa.me/5511961890347?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: `Consulta sobre: ${product.name}`,
    });
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Confira este produto: ${product.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };

  if (fetchingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-2xl mb-4">Carregando detalhes do produto...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mb-4 text-6xl opacity-20">😢</div>
          <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
          <Button onClick={() => navigate('/catalogo')}>
            Voltar ao Catálogo
          </Button>
        </div>
      </div>
    );
  }

  const displayPrice = product.is_promotion && (product.promotion_wholesale_price || product.promotion_retail_price)
    ? (product.promotion_retail_price || product.promotion_wholesale_price) 
    : product.retail_price || product.wholesale_price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header />

      {/* Back Button */}
      <div className="sticky top-[56px] sm:top-[64px] z-40 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <Button
            onClick={() => navigate(`/catalogo/${encodeURIComponent(product.category)}`)}
            variant="default"
            className="gap-2 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all"
            size="default"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Product Details */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden bg-surface-elevated shadow-strong">
              <div className="aspect-[3/4] relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated to-surface animate-pulse" />
                )}
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                />
                {product.is_promotion && (
                  <Badge className="absolute top-4 left-4 bg-gradient-to-r from-accent to-primary text-white text-sm font-medium shadow-medium border-0">
                    🔥 PROMOÇÃO
                  </Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {product.category}
                  </Badge>
                  {product.subcategory && (
                    <Badge variant="outline" className="text-sm">
                      {product.subcategory}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-lg text-foreground-muted leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Tamanhos */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Selecione o Tamanho:</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => (
                      <div key={size} className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSize(prev => prev === size ? undefined : size)}
                          className={cn(
                            "min-w-[50px] h-12 text-sm font-bold px-4 py-2 rounded-xl border-2 transition-all duration-300",
                            selectedSize === size
                              ? "bg-primary text-primary-foreground border-primary shadow-glow scale-105"
                              : "bg-surface text-foreground border-card-border hover:border-primary/50"
                          )}
                        >
                          {size}
                        </button>
                        {size === 'G1' && product.category?.toLowerCase() === 'conjuntos' && (
                          <span className="text-xs text-accent font-bold">+ R$ 10,00</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prices */}
              {displayPrice !== undefined && (
                <div className="bg-white/60 rounded-xl border border-border-subtle p-6 shadow-soft">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground-muted">💰 Valor Atacado (10+ pçs):</span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-primary text-2xl sm:text-3xl">
                          {formatCurrency((product.is_promotion && product.promotion_wholesale_price ? product.promotion_wholesale_price : (product.wholesale_price || 0)) + extraPrice)}
                        </span>
                        {extraPrice > 0 && <span className="text-xs text-accent font-medium">(Incluso +R$ 10 do tamanho G1)</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground-muted">📦 Valor Varejo:</span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-accent text-2xl sm:text-3xl">
                          {formatCurrency((product.is_promotion && product.promotion_retail_price ? product.promotion_retail_price : (product.retail_price || 0)) + extraPrice)}
                        </span>
                        {extraPrice > 0 && <span className="text-xs text-accent font-medium">(Incluso +R$ 10 do tamanho G1)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.is_out_of_stock || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                  className={cn(
                    "flex-1 text-base h-16 font-bold rounded-xl shadow-medium transition-all duration-300 hover:scale-105",
                    justAdded 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-gradient-to-r from-primary to-primary-hover text-white hover:shadow-glow"
                  )}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-6 h-6 mr-2" />
                      Adicionado ao Carrinho!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6 mr-2" />
                      Adicionar ao Carrinho
                    </>
                  )}
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleConsult}
                  className="h-16 px-6 rounded-xl border-2 hover:bg-surface-elevated transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleShare}
                  className="h-16 px-6 rounded-xl border-2 hover:bg-surface-elevated transition-colors"
                >
                  <Share2 className="w-6 h-6 text-primary" />
                </Button>
              </div>

              <p className="text-sm text-foreground-muted text-center">
                Entre em contato para verificar disponibilidade, cores e condições de compra
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductPage;
