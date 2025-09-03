import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const availableColors = [
  "Branco", "Preto", "Azul", "Rosa", "Verde", "Vermelho", 
  "Amarelo", "Roxo", "Cinza", "Marrom", "Bege", "Listrado"
];

const priceRanges = [
  { label: "Até R$ 50", min: 0, max: 50 },
  { label: "R$ 50 - R$ 100", min: 50, max: 100 },
  { label: "R$ 100 - R$ 150", min: 100, max: 150 },
  { label: "Acima de R$ 150", min: 150, max: 999 },
];

export interface FilterState {
  colors: string[];
  priceRange: [number, number];
  sortBy: string;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
}

export const ProductFilters = ({ 
  filters, 
  onFiltersChange, 
  resultCount 
}: ProductFiltersProps) => {
  const [colorsOpen, setColorsOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const toggleColor = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    
    onFiltersChange({ ...filters, colors: newColors });
  };

  const clearFilters = () => {
    onFiltersChange({
      colors: [],
      priceRange: [0, 300],
      sortBy: "name"
    });
  };

  const hasActiveFilters = filters.colors.length > 0 || 
                          filters.priceRange[0] > 0 || 
                          filters.priceRange[1] < 300;

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-foreground">Filtros Ativos</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.colors.map(color => (
              <Badge 
                key={color} 
                variant="secondary"
                className="bg-accent-soft text-accent-foreground cursor-pointer hover:bg-accent/20"
                onClick={() => toggleColor(color)}
              >
                {color}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Colors Filter */}
      <Collapsible open={colorsOpen} onOpenChange={setColorsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-auto">
            <h4 className="font-medium text-sm text-foreground">Cores</h4>
            <ChevronDown className={`w-4 h-4 transition-transform ${colorsOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-3">
          <div className="grid grid-cols-2 gap-2">
            {availableColors.map((color) => (
              <Button
                key={color}
                variant={filters.colors.includes(color) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleColor(color)}
                className="justify-start text-xs h-8"
              >
                {color}
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Price Filter */}
      <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-auto">
            <h4 className="font-medium text-sm text-foreground">Faixa de Preço</h4>
            <ChevronDown className={`w-4 h-4 transition-transform ${priceOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  priceRange: [range.min, range.max] 
                })}
                className="w-full justify-start text-xs h-8"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>R$ {filters.priceRange[0]}</span>
              <span>R$ {filters.priceRange[1]}</span>
            </div>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, priceRange: value as [number, number] })
              }
              max={300}
              min={0}
              step={10}
              className="w-full"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Sort Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">Ordenar por</h4>
        <div className="space-y-2">
          {[
            { value: "name", label: "Nome A-Z" },
            { value: "price-low", label: "Menor Preço" },
            { value: "price-high", label: "Maior Preço" },
            { value: "newest", label: "Mais Recentes" }
          ].map((option) => (
            <Button
              key={option.value}
              variant={filters.sortBy === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, sortBy: option.value })}
              className="w-full justify-start text-xs h-8"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block w-64 bg-surface border-r border-card-border p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Filtros</h3>
          <Badge variant="outline" className="text-xs">
            {resultCount} produtos
          </Badge>
        </div>
        <FiltersContent />
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs">
                  !
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filtros
                <Badge variant="outline" className="text-xs">
                  {resultCount} produtos
                </Badge>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};