import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Upload, Package, LogOut } from 'lucide-react';

const AdminHome = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo, {user?.email}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/admin/import'); } }}
                onClick={() => navigate('/admin/import')}>
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
              <Button className="mt-4 w-full" onClick={() => navigate('/admin/import')}>
                Acessar Importação
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-muted-foreground">Gerenciar Produtos</CardTitle>
                  <CardDescription>
                    Visualizar e editar produtos cadastrados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: gerenciamento completo do catálogo de produtos.
              </p>
              <Button disabled className="mt-4 w-full">
                Em Desenvolvimento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;