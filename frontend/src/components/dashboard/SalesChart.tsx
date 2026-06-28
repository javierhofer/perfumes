import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { DashboardMetrics } from '../../types/domain';
import { formatearARS, formatearFechaCorta } from '../../hooks/formato';

interface SalesChartProps {
  data: DashboardMetrics['ventasUltimos30Dias'];
}

export const SalesChart = ({ data }: SalesChartProps) => {
  const puntos = data.length > 0 ? data : [{ fecha: new Date().toISOString().substring(0, 10), total: 0 }];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📈</span>
        <h3 className="font-semibold text-slate-800">Flujo de Ventas (ultimos 30 dias)</h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={puntos} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatearFechaCorta}
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <Tooltip
              formatter={(value: number) => formatearARS(value)}
              labelFormatter={(label: string) => `Fecha: ${formatearFechaCorta(label)}`}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#gradVentas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};