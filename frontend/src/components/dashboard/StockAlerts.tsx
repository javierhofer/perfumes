import type { Perfume } from '../../types/domain';
import { formatearARS } from '../../hooks/formato';

interface StockAlertsProps {
  alertas: Perfume[];
}

export const StockAlerts = ({ alertas }: StockAlertsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚠️</span>
        <h3 className="font-semibold text-slate-800">Alertas de Reposicion</h3>
        <span className="ml-auto text-xs font-medium bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
          {alertas.length} {alertas.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>
      {alertas.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center">
          ✓ Sin alertas. Tu stock esta saludable.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {alertas.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    p.stock === 0 ? 'bg-rose-600' : p.stock === 1 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <div className="font-medium text-sm text-slate-800">
                    {p.marca} · {p.fragancia}
                  </div>
                  <div className="text-xs text-slate-500">
                    {p.tipo} · {p.mililitros}ml · {formatearARS(p.precioVenta)}
                  </div>
                </div>
              </div>
              <div
                className={`text-sm font-semibold ${
                  p.stock === 0 ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                {p.stock} un.
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};