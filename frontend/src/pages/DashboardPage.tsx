import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardMetrics, Perfume } from '../types/domain';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StockAlerts } from '../components/dashboard/StockAlerts';
import { SalesChart } from '../components/dashboard/SalesChart';

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alertas, setAlertas] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, a] = await Promise.all([api.getDashboardMetrics(), api.getAlertasStock()]);
      setMetrics(m);
      setAlertas(a);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (loading && !metrics) {
    return <div className="p-8 text-slate-500">Cargando metricas...</div>;
  }
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-4">
          Error: {error}. Asegurate de que el backend este corriendo en :3001.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Vision general del negocio</p>
        </div>
        <button
          onClick={cargar}
          className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg"
        >
          ↻ Actualizar
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard titulo="Ventas Totales" valor={metrics!.ventasTotales} icono="💰" acento="purple" />
        <MetricCard titulo="Ganancia Neta" valor={metrics!.gananciaNeta} icono="📊" acento="green" />
        <MetricCard
          titulo="Fragancias en Stock"
          valor={metrics!.totalFraganciasEnStock}
          formato="numero"
          icono="🧴"
          acento="amber"
        />
        <Link
          to="/clientes?conDeuda=true"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:border-rose-300 hover:shadow-md transition-all"
        >
          <MetricCard titulo="Cuentas por Cobrar" valor={metrics!.cuentasPorCobrar} icono="⏳" acento="rose" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart data={metrics!.ventasUltimos30Dias} />
        </div>
        <div>
          <StockAlerts alertas={alertas} />
        </div>
      </div>
    </div>
  );
};