import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Upload, MessageSquare } from 'lucide-react';
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

        <div className="max-w-md mx-auto space-y-6">
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

          <Card className="hover:shadow-lg transition-shadow border-emerald-200 bg-emerald-50/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-emerald-600" />
                <div>
                  <CardTitle className="text-emerald-800">Canais de Venda</CardTitle>
                  <CardDescription className="text-emerald-700">
                    Configurações do WhatsApp e Pedidos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-700">
                Personalize o número de destino, cabeçalhos e emojis das mensagens de pedido.
              </p>
              <Button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none" asChild>
                <Link to="/admin/whatsapp">Configurar WhatsApp</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-amber-200 bg-amber-50/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-amber-600" />
                <div>
                  <CardTitle className="text-amber-800">Recuperar Fotos</CardTitle>
                  <CardDescription className="text-amber-700">
                    Arrume fotos com links quebrados em massa
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                Otimizado para re-upload rápido das imagens do projeto antigo.
              </p>
              <Button className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white border-none" asChild>
                <Link to="/admin/photo-recovery">Abrir Ferramenta</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;