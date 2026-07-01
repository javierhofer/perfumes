import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './components/auth/LoginPage';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InventarioPage } from './pages/InventarioPage';
import { CrmPage } from './pages/CrmPage';
import { ClientesPage } from './pages/ClientesPage';
import { VentasPage } from './pages/VentasPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { PrivacidadPage } from './pages/PrivacidadPage';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ConfiguracionPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
