import { useEffect, useMemo, useState } from 'react';
import type { Cliente, Perfume, TipoPago } from '../../types/domain';
import { formatearARS } from '../../hooks/formato';

interface QuickSaleModalProps {
  perfume?: Perfume | null;
  perfumes?: Perfume[];
  clientes: Cliente[];
  preselectedClienteId?: string;
  onClose: () => void;
  onConfirm: (data: { clienteId: string; cantidad: number; tipoPago: TipoPago }) => Promise<void>;
}

export const QuickSaleModal = ({
  perfume,
  perfumes,
  clientes,
  preselectedClienteId,
  onClose,
  onConfirm,
}: QuickSaleModalProps) => {
  const listaPerfumes = perfumes ?? (perfume ? [perfume] : []);
  const [perfumeId, setPerfumeId] = useState<string>(perfume?.id ?? listaPerfumes[0]?.id ?? '');
  const perfumeActual = useMemo(
    () => listaPerfumes.find((p) => p.id === perfumeId) ?? null,
    [listaPerfumes, perfumeId]
  );

  const [clienteId, setClienteId] = useState<string>(preselectedClienteId ?? clientes[0]?.id ?? '');
  const [cantidad, setCantidad] = useState<number>(1);
  const [tipoPago, setTipoPago] = useState<TipoPago>('Efectivo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (perfume) setPerfumeId(perfume.id);
  }, [perfume]);

  const total = useMemo(
    () => (perfumeActual ? cantidad * perfumeActual.precioVenta : 0),
    [cantidad, perfumeActual]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfumeActual) {
      setError('Selecciona un perfume');
      return;
    }
    if (!clienteId) {
      setError('Selecciona un cliente');
      return;
    }
    if (cantidad <= 0 || cantidad > perfumeActual.stock) {
      setError(`Cantidad debe estar entre 1 y ${perfumeActual.stock}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({ clienteId, cantidad, tipoPago });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Registrar venta</div>
              <h2 className="font-semibold text-lg">
                {perfumeActual ? `${perfumeActual.marca} · ${perfumeActual.fragancia}` : 'Nueva venta'}
              </h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
              ×
            </button>
          </div>
          {perfumeActual && (
            <div className="text-xs mt-1 opacity-80">
              {perfumeActual.tipo} · {perfumeActual.mililitros}ml · Stock actual: {perfumeActual.stock}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {listaPerfumes.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Perfume</label>
              <select
                value={perfumeId}
                onChange={(e) => setPerfumeId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {listaPerfumes.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.marca} · {p.fragancia} ({p.stock} un.)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={!!preselectedClienteId}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-700"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {preselectedClienteId && (
              <div className="text-[10px] text-slate-500 mt-1">Cliente preseleccionado desde la ficha</div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              max={perfumeActual?.stock ?? 1}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Efectivo', 'Transferencia', 'CuentaCorriente'] as TipoPago[]).map((op) => (
                <button
                  type="button"
                  key={op}
                  onClick={() => setTipoPago(op)}
                  className={`text-xs py-2 px-2 rounded-lg border transition-colors ${
                    tipoPago === op
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400'
                  }`}
                >
                  {op === 'CuentaCorriente' ? 'Cta. Cte.' : op}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Total</span>
            <span className="text-xl font-semibold text-slate-800">{formatearARS(total)}</span>
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
              disabled={submitting || !perfumeActual}
              className="flex-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Confirmar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};