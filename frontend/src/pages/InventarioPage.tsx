import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Cliente, Perfume, TipoPago } from '../types/domain';
import { formatearARS } from '../hooks/formato';
import { QuickSaleModal } from '../components/inventario/QuickSaleModal';

export const InventarioPage = () => {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [perfumeVenta, setPerfumeVenta] = useState<Perfume | null>(null);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'warn'; mensaje: string } | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([api.listarPerfumes(), api.listarClientes()]);
      setPerfumes(p);
      setClientes(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const marcas = useMemo(() => Array.from(new Set(perfumes.map((p) => p.marca))).sort(), [perfumes]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return perfumes.filter((p) => {
      if (marcaFiltro && p.marca !== marcaFiltro) return false;
      if (!q) return true;
      return (
        p.marca.toLowerCase().includes(q) ||
        p.fragancia.toLowerCase().includes(q) ||
        p.tipo.toLowerCase().includes(q)
      );
    });
  }, [perfumes, busqueda, marcaFiltro]);

  const handleConfirmarVenta = async (data: { clienteId: string; cantidad: number; tipoPago: TipoPago }) => {
    if (!perfumeVenta) return;
    const r = await api.registrarVenta({ productoId: perfumeVenta.id, ...data });
    setPerfumeVenta(null);
    await cargar();
    if (r.alertaReposicion) {
      setToast({ tipo: 'warn', mensaje: `Venta registrada. Stock restante: ${r.stockRestante}. Alerta critica!` });
    } else {
      setToast({ tipo: 'ok', mensaje: `Venta registrada. Stock restante: ${r.stockRestante}.` });
    }
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-4 md:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800">Inventario</h1>
          <p className="text-sm text-slate-500 mt-1">Catalogo de fragancias · {perfumes.length} productos</p>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por marca, fragancia o tipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 min-w-[240px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
        <select
          value={marcaFiltro}
          onChange={(e) => setMarcaFiltro(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Marca / Fragancia</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">ml</th>
                <th className="text-right px-4 py-3 font-medium">Costo</th>
                <th className="text-right px-4 py-3 font-medium">Venta</th>
                <th className="text-right px-4 py-3 font-medium">Margen</th>
                <th className="text-center px-4 py-3 font-medium">Stock</th>
                <th className="text-center px-4 py-3 font-medium">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Sin resultados para tu busqueda.
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.marca}</div>
                      <div className="text-xs text-slate-500">{p.fragancia}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{p.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{p.mililitros}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatearARS(p.precioCosto)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatearARS(p.precioVenta)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                      {formatearARS(p.margen)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.alertaCritica
                            ? 'bg-rose-100 text-rose-700'
                            : p.stock <= 6
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setPerfumeVenta(p)}
                        disabled={p.stock === 0}
                        className="text-xs bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        title={p.stock === 0 ? 'Sin stock' : 'Registrar venta'}
                      >
                        ⚡ Venta
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {perfumeVenta && (
        <QuickSaleModal
          perfume={perfumeVenta}
          clientes={clientes}
          onClose={() => setPerfumeVenta(null)}
          onConfirm={handleConfirmarVenta}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.tipo === 'warn'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.mensaje}
          </div>
        </div>
      )}
    </div>
  );
};