import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Menu, Search, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import sulbrasilLogo from "@/assets/sulbrasil-logo.png";

const categories = [
  { name: "Blusas e Camisetas", color: "category-blusas", count: 45 },
  { name: "Vestidos", color: "category-vestidos", count: 32 },
  { name: "Calças", color: "category-calcas", count: 28 },
  { name: "Shorts", color: "category-shorts", count: 22 },
  { name: "Conjuntos", color: "category-conjuntos", count: 18 },
  { name: "Listradas e Estonadas", color: "category-listradas", count: 35 }
];

interface HeaderProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
  cartItemsCount?: number;
}

export const Header = ({ onCategorySelect, selectedCategory, cartItemsCount = 0 }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <img 
              src={sulbrasilLogo} 
              alt="Sulbrasil" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold text-primary">Sulbrasil</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Button 
              variant={selectedCategory === "" ? "default" : "ghost"}
              onClick={() => onCategorySelect("")}
              className="text-sm font-medium"
            >
              Início
            </Button>
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "ghost"}
                onClick={() => onCategorySelect(category.name)}
                className="text-sm font-medium relative"
              >
                {category.name}
                <Badge 
                  variant="secondary" 
                  className="ml-2 text-xs bg-accent-soft text-accent-foreground"
                >
                  {category.count}
                </Badge>
              </Button>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10 w-64 bg-surface border-card-border"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
            
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex flex-col gap-4 mt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
                    <Input
                      placeholder="Buscar produtos..."
                      className="pl-10 bg-surface border-card-border"
                    />
                  </div>
                  
                  <Button 
                    variant={selectedCategory === "" ? "default" : "ghost"}
                    onClick={() => onCategorySelect("")}
                    className="justify-start"
                  >
                    Início
                  </Button>
                  
                  {categories.map((category) => (
                    <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? "default" : "ghost"}
                      onClick={() => onCategorySelect(category.name)}
                      className="justify-between"
                    >
                      <span>{category.name}</span>
                      <Badge 
                        variant="secondary" 
                        className="bg-accent-soft text-accent-foreground"
                      >
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};