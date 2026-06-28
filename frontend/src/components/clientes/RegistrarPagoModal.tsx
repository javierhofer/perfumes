import { useState } from 'react';
import { formatearARS } from '../../hooks/formato';

interface RegistrarPagoModalProps {
  clienteNombre: string;
  saldoActual: number;
  onClose: () => void;
  onConfirm: (monto: number, nota: string) => Promise<void>;
}

export const RegistrarPagoModal = ({
  clienteNombre,
  saldoActual,
  onClose,
  onConfirm,
}: RegistrarPagoModalProps) => {
  const [monto, setMonto] = useState<number>(saldoActual);
  const [nota, setNota] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(monto, nota);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Registrar pago</div>
            <h2 className="font-semibold text-lg">{clienteNombre}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Saldo deudor actual:</span>
              <span className="font-semibold text-rose-700">{formatearARS(saldoActual)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Monto abonado</label>
            <input
              autoFocus
              type="number"
              min={1}
              step={1}
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setMonto(saldoActual)}
                className="text-[10px] text-brand-600 hover:underline"
              >
                Todo
              </button>
              <button
                type="button"
                onClick={() => setMonto(Math.round(saldoActual / 2))}
                className="text-[10px] text-brand-600 hover:underline"
              >
                Mitad
              </button>
              <button
                type="button"
                onClick={() => setMonto(Math.round(saldoActual / 3))}
                className="text-[10px] text-brand-600 hover:underline"
              >
                Tercera parte
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nota (opcional)</label>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Ej: efectivo, transferencia, etc."
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};