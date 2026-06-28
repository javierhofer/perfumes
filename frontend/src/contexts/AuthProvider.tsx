import { createContext, useContext, useState, ReactNode } from 'react';
import { Sesion, Rol, login as doLogin, logout as doLogout, getSesion } from '../lib/auth';

interface AuthContextType {
  sesion: Sesion | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [sesion, setSesion] = useState<Sesion | null>(getSesion());

  const login = (username: string, password: string): boolean => {
    const result = doLogin(username, password);
    if (result) setSesion(result);
    return !!result;
  };

  const logout = (): void => {
    doLogout();
    setSesion(null);
  };

  return (
    <AuthContext.Provider value={{ sesion, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};

export const useRol = (): Rol | null => {
  const { sesion } = useAuth();
  return sesion?.rol ?? null;
};
