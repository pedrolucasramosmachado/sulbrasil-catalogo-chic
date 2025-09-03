import { Button } from "@/components/ui/button";
import { ShoppingBag, User } from "lucide-react";
import { Link } from "react-router-dom";
import sulbrasilLogo from "@/assets/sulbrasil-logo.png";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <img 
              src={sulbrasilLogo} 
              alt="Sulbrasil" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold text-primary">Sulbrasil</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5" />
            </Button>
            
            <Link to="/admin/login">
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};