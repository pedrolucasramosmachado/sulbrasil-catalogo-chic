import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Product } from "@/hooks/useProducts";

interface HeaderProps {
  onSearchResults?: (results: Product[], query: string) => void;
}

export const Header = ({ onSearchResults }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          <Link to="/catalogo" className="flex items-center gap-2 sm:gap-4 shrink-0">
            <img 
              src="/images/logo-sulbrasil.png" 
              alt="Sulbrasil" 
              className="h-8 sm:h-10 w-auto"
            />
            <h1 className="text-lg sm:text-xl font-bold text-primary hidden sm:block">Sulbrasil</h1>
          </Link>

          <SearchBar onSearchResults={onSearchResults} />

          <div className="flex items-center shrink-0">
            <Link to="/admin/products">
              <Button variant="ghost" size="icon" className="w-10 h-10 sm:w-12 sm:h-12">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
