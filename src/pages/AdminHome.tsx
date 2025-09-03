import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Package } from 'lucide-react';
import { AdminHeader } from '@/components/AdminHeader';

const AdminHome = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <AdminHeader 
          title="Painel Administrativo" 
          description={`Bem-vindo, ${user?.email}`} 
        />

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Importar Catálogo</CardTitle>
                  <CardDescription>
                    Faça upload de imagens e dados dos produtos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Adicione produtos ao catálogo através de imagens e arquivos CSV.
              </p>
              <Button className="mt-4 w-full" asChild>
                <Link to="/admin/import">Acessar Importação</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Gerenciar Produtos</CardTitle>
                  <CardDescription>
                    Visualizar e editar produtos cadastrados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie todos os produtos do catálogo de forma completa.
              </p>
              <Button className="mt-4 w-full" asChild>
                <Link to="/admin/products">Gerenciar Produtos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;