import { useState } from 'react';
import type { Cliente } from '../../types/domain';
import { formatearARS } from '../../hooks/formato';

interface EliminarClienteModalProps {
  cliente: Cliente;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const EliminarClienteModal = ({ cliente, onClose, onConfirm }: EliminarClienteModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  const compras = cliente.historialCompras?.length ?? 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
              ⚠️
            </div>
            <h2 className="font-semibold text-lg">Dar de baja</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {cliente.nombre.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-slate-800">{cliente.nombre}</div>
              <div className="text-xs text-slate-500">{cliente.telefono}</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <div className="text-amber-800 font-medium mb-1">Vas a dar de baja a este cliente.</div>
            <ul className="text-xs text-amber-700 space-y-1 mt-2 list-disc list-inside">
              <li>{compras} {compras === 1 ? 'compra historica' : 'compras historicas'}</li>
              <li>Saldo pendiente actual: <span className="font-semibold">{formatearARS(cliente.saldoDeudor || 0)}</span></li>
            </ul>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            Sus ventas y pagos seguiran visibles en el sistema, pero no podra recibir nuevas ventas.
            Esta accion es reversible editando el cliente y marcandolo como activo nuevamente.
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
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Procesando...' : 'Confirmar baja'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};