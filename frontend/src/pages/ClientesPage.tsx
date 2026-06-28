import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Cliente } from '../types/domain';
import { formatearARS } from '../hooks/formato';
import { esDeudaCritica, formatearUmbral } from '../hooks/deudaCritica';
import { ClienteFormModal } from '../components/clientes/ClienteFormModal';
import { ClienteDrawer } from '../components/clientes/ClienteDrawer';
import { TagsReadonly } from '../components/clientes/TagsSelector';
import { generarCSV, descargarCSV, nombreArchivo } from '../utils/csv';

export const ClientesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'warn'; mensaje: string } | null>(null);

  const conDeuda = searchParams.get('conDeuda') === 'true';

  const cargar = async () => {
    setLoading(true);
    try {
      const data = conDeuda
        ? await api.listarClientes({ conDeuda: true })
        : await api.listarClientes();
      setClientes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [conDeuda]);

  const todasLasEtiquetas = useMemo(() => {
    const set = new Set<string>();
    clientes.forEach((c) => c.etiquetas?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [clientes]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return clientes.filter((c) => {
      if (filtroEtiqueta && !(c.etiquetas ?? []).includes(filtroEtiqueta)) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        c.notasPersonales.toLowerCase().includes(q) ||
        (c.etiquetas ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [clientes, busqueda, filtroEtiqueta]);

  const totalDeuda = useMemo(
    () => clientes.reduce((acc, c) => acc + (c.saldoDeudor || 0), 0),
    [clientes]
  );

  const clientesConDeudaCritica = useMemo(
    () => clientes.filter((c) => esDeudaCritica(c.saldoDeudor)).length,
    [clientes]
  );

  const handleCrear = async (data: { nombre: string; telefono: string; notasPersonales: string; etiquetas: string[] }) => {
    const nuevo = await api.crearCliente(data);
    setShowForm(false);
    await cargar();
    setToast({ tipo: 'ok', mensaje: `Cliente ${nuevo.nombre} creado.` });
    setTimeout(() => setToast(null), 3000);
  };

  const exportarCSV = () => {
    const filas = filtrados.map((c) => ({
      Nombre: c.nombre,
      Telefono: c.telefono,
      Etiquetas: (c.etiquetas ?? []).join(' | '),
      Notas: c.notasPersonales,
      'Saldo Deudor': c.saldoDeudor,
      Activo: c.activo ? 'Si' : 'No',
      Compras: c.historialCompras?.length ?? 0,
    }));
    const filtroTag = filtroEtiqueta ? `_${filtroEtiqueta}` : '';
    descargarCSV(
      nombreArchivo(`clientes${filtroTag}`),
      generarCSV(filas)
    );
    setToast({ tipo: 'ok', mensaje: `Exportados ${filas.length} clientes a CSV.` });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {conDeuda
              ? `${clientes.length} cliente${clientes.length === 1 ? '' : 's'} con deuda activa`
              : `${clientes.length} clientes registrados`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {conDeuda && (
            <button
              onClick={() => setSearchParams({})}
              className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg"
            >
              Ver todos
            </button>
          )}
          {filtrados.length > 0 && (
            <button
              onClick={exportarCSV}
              className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg"
              title={`Exportar ${filtrados.length} clientes a CSV`}
            >
              📥 <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium shadow-sm"
          >
            + <span className="hidden sm:inline">Nuevo Cliente</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </header>

      {!conDeuda && totalDeuda > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-rose-700 font-medium">
              Total cuentas por cobrar
            </div>
            <div className="text-2xl font-bold text-rose-700">{formatearARS(totalDeuda)}</div>
            {clientesConDeudaCritica > 0 && (
              <div className="text-xs text-rose-700 mt-1">
                ⚠️ {clientesConDeudaCritica} cliente{clientesConDeudaCritica === 1 ? '' : 's'} con deuda
                critica (mayor a {formatearUmbral()})
              </div>
            )}
          </div>
          <button
            onClick={() => setSearchParams({ conDeuda: 'true' })}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg font-medium"
          >
            Ver solo con deuda →
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, telefono, notas o etiqueta..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 min-w-[240px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
        {todasLasEtiquetas.length > 0 && (
          <select
            value={filtroEtiqueta}
            onChange={(e) => setFiltroEtiqueta(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Todas las etiquetas</option>
            {todasLasEtiquetas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Etiquetas</th>
                <th className="text-left px-4 py-3 font-medium">Notas</th>
                <th className="text-center px-4 py-3 font-medium">Compras</th>
                <th className="text-right px-4 py-3 font-medium">Saldo Deudor</th>
                <th className="text-center px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    {conDeuda ? 'No hay clientes con deuda activa.' : 'No hay clientes. Crea el primero.'}
                  </td>
                </tr>
              ) : (
                filtrados.map((c) => {
                  const critica = esDeudaCritica(c.saldoDeudor);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setDrawerId(c.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {c.nombre.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">{c.nombre}</div>
                            <div className="text-xs text-slate-500">{c.telefono}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TagsReadonly tags={c.etiquetas ?? []} max={2} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {c.notasPersonales || '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {c.historialCompras?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {critica && (
                            <span
                              className="text-rose-600 text-sm"
                              title={`Deuda critica (mayor a ${formatearUmbral()})`}
                            >
                              ⚠️
                            </span>
                          )}
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              c.saldoDeudor > 0
                                ? critica
                                  ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                                  : 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {formatearARS(c.saldoDeudor)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">→</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ClienteFormModal onClose={() => setShowForm(false)} onSave={handleCrear} />
      )}

      {drawerId && (
        <ClienteDrawer
          clienteId={drawerId}
          onClose={() => setDrawerId(null)}
          onChange={cargar}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.tipo === 'warn' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.mensaje}
          </div>
        </div>
      )}
    </div>
  );
};