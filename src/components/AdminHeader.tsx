import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LogOut, Package, Truck, ListOrdered, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminHeaderProps {
  title: string;
  description: string;
}

export const AdminHeader = ({ title, description }: AdminHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Início
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
        
        {/* Admin Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button 
            variant={isActive('/admin/products') ? 'default' : 'outline'} 
            size="sm"
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Produtos
          </Button>
          <Button 
            variant={isActive('/admin/categories') ? 'default' : 'outline'} 
            size="sm"
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-2"
          >
            <ListOrdered className="h-4 w-4" />
            Categorias
          </Button>
          <Button 
            variant={isActive('/admin/whatsapp') ? 'default' : 'outline'} 
            size="sm"
            onClick={() => navigate('/admin/whatsapp')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button 
            variant={isActive('/admin/shipping') ? 'default' : 'outline'} 
            size="sm"
            onClick={() => navigate('/admin/shipping')}
            className="flex items-center gap-2"
          >
            <Truck className="h-4 w-4" />
            Simulador Frete
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};