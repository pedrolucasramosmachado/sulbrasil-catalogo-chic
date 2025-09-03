import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-fashion.jpg";

interface HeroSectionProps {
  onExploreProducts: () => void;
}

export const HeroSection = ({ onExploreProducts }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-surface to-surface-elevated">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 lg:pr-8">
            <div className="space-y-4">
              <Badge className="inline-flex items-center gap-2 bg-accent-soft text-accent-foreground px-4 py-2">
                <Sparkles className="w-4 h-4" />
                Coleção Nova Temporada
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Elegância que 
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}Inspira
                </span>
              </h1>
              
              <p className="text-xl text-foreground-muted leading-relaxed max-w-lg">
                Descubra a coleção exclusiva Sulbrasil. Moda feminina com 
                qualidade premium, preços especiais para atacado e varejo.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">200+</p>
                <p className="text-sm text-foreground-muted">Produtos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">15+</p>
                <p className="text-sm text-foreground-muted">Anos no Mercado</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">1000+</p>
                <p className="text-sm text-foreground-muted">Clientes</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={onExploreProducts}
                className="group text-base font-semibold px-8 py-4 h-auto"
              >
                Explorar Catálogo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-base font-semibold px-8 py-4 h-auto border-2 hover:bg-surface"
              >
                Falar com Consultor
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              {[
                { icon: "✨", title: "Qualidade Premium", desc: "Tecidos selecionados" },
                { icon: "🚚", title: "Entrega Rápida", desc: "Para todo o Brasil" },
                { icon: "💎", title: "Preço Especial", desc: "Atacado e varejo" }
              ].map((feature, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-2xl">{feature.icon}</div>
                  <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                  <p className="text-xs text-foreground-muted">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-strong">
              <img
                src={heroImage}
                alt="Moda Feminina Sulbrasil"
                className="w-full aspect-[4/5] object-cover"
              />
              
              {/* Overlay with gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {/* Floating badges */}
              <div className="absolute top-6 left-6">
                <Badge className="bg-background/90 text-foreground backdrop-blur-sm">
                  Fábrica Oficial
                </Badge>
              </div>
              
              <div className="absolute bottom-6 right-6">
                <Badge className="bg-accent/90 text-accent-foreground backdrop-blur-sm">
                  Novos Modelos
                </Badge>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-xl" />
          </div>
        </div>
      </div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 1px, transparent 1px),
                                radial-gradient(circle at 75% 75%, hsl(var(--accent)) 1px, transparent 1px)`,
               backgroundSize: '50px 50px'
             }} 
        />
      </div>
    </section>
  );
};