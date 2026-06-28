import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InventarioPage } from './pages/InventarioPage';
import { CrmPage } from './pages/CrmPage';
import { ClientesPage } from './pages/ClientesPage';
import { VentasPage } from './pages/VentasPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};