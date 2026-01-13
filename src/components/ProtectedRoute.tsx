import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo-ordre.png';

interface ProtectedRouteProps {
  children: ReactNode;
  requireGuardian?: boolean;
}

export function ProtectedRoute({ children, requireGuardian = false }: ProtectedRouteProps) {
  const { user, isLoading, isGuardianSupreme } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logo} 
            alt="L'Ordre" 
            className="w-20 h-20 mx-auto mb-4 animate-pulse-slow lunar-glow"
          />
          <p className="text-muted-foreground text-sm font-heading tracking-widest">
            VÉRIFICATION EN COURS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireGuardian && !isGuardianSupreme) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
