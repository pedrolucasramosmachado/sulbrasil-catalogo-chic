import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário, redirecionar declarativamente para a tela de login
  if (!user) {
    return <Navigate to="/admin/login?message=access_denied" state={{ from: location }} replace />;
  }

  // Verificar se o email está autorizado
  if (user.email !== 'pedroramosmachado19@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar esta área.
          </p>
          <button
            onClick={() => {
              import('@/integrations/supabase/client').then(({ supabase }) => {
                supabase.auth.signOut();
              });
            }}
            className="text-primary hover:underline"
          >
            Fazer logout
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};