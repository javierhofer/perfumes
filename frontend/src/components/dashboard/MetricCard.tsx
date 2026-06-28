import type { ReactNode } from 'react';
import { formatearARS } from '../../hooks/formato';

interface MetricCardProps {
  titulo: string;
  valor: number;
  formato?: 'moneda' | 'numero';
  icono: ReactNode;
  acento?: 'purple' | 'green' | 'amber' | 'rose';
}

const acentoMap = {
  purple: 'from-brand-500 to-brand-700',
  green: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  rose: 'from-rose-500 to-rose-700',
};

export const MetricCard = ({ titulo, valor, formato = 'moneda', icono, acento = 'purple' }: MetricCardProps) => {
  const display = formato === 'moneda' ? formatearARS(valor) : valor.toLocaleString('es-AR');
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${acentoMap[acento]} flex items-center justify-center text-white text-xl shadow-md`}
      >
        {icono}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{titulo}</div>
        <div className="text-2xl font-semibold text-slate-800 truncate">{display}</div>
      </div>
    </div>
  );
};