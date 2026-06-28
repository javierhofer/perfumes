import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';
import { Rol } from '../../lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Rol[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { sesion } = useAuth();

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(sesion.rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
