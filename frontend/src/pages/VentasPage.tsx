import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { VentaListada } from '../types/domain';
import { formatearARS, formatearFechaCorta } from '../hooks/formato';
import { generarCSV, descargarCSV, nombreArchivo } from '../utils/csv';

type EstadoFiltro = 'Todos' | 'Pagado' | 'Pendiente' | 'Parcial';
type TipoPagoFiltro = 'Todos' | 'Efectivo' | 'Transferencia' | 'CuentaCorriente';

const badgeEstado = (estado: string) => {
  if (estado === 'Pagado')
    return <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">PAGADO</span>;
  if (estado === 'Parcial')
    return <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">PARCIAL</span>;
  return <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">PENDIENTE</span>;
};

const badgeTipoPago = (tipo: string) => {
  const map: Record<string, string> = {
    Efectivo: 'bg-slate-100 text-slate-700',
    Transferencia: 'bg-blue-100 text-blue-700',
    CuentaCorriente: 'bg-amber-100 text-amber-700',
  };
  const label = tipo === 'CuentaCorriente' ? 'Cta. Cte.' : tipo;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[tipo] || 'bg-slate-100 text-slate-700'}`}>
      {label}
    </span>
  );
};

export const VentasPage = () => {
  const [ventas, setVentas] = useState<VentaListada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('Todos');
  const [filtroTipoPago, setFiltroTipoPago] = useState<TipoPagoFiltro>('Todos');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await api.listarVentas();
      setVentas(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return ventas.filter((v) => {
      if (filtroEstado !== 'Todos' && v.estadoPago !== filtroEstado) return false;
      if (filtroTipoPago !== 'Todos' && v.tipoPago !== filtroTipoPago) return false;
      const fecha = v.fecha.substring(0, 10);
      if (filtroDesde && fecha < filtroDesde) return false;
      if (filtroHasta && fecha > filtroHasta) return false;
      if (q) {
        return (
          v.clienteNombre.toLowerCase().includes(q) ||
          v.productoNombre.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ventas, busqueda, filtroEstado, filtroTipoPago, filtroDesde, filtroHasta]);

  const totales = useMemo(() => {
    const total = filtradas.reduce((acc, v) => acc + v.total, 0);
    const pagado = filtradas.reduce((acc, v) => acc + (v.montoPagado ?? 0), 0);
    const pendiente = total - pagado;
    return { total, pagado, pendiente };
  }, [filtradas]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('Todos');
    setFiltroTipoPago('Todos');
    setFiltroDesde('');
    setFiltroHasta('');
  };

  const exportarCSV = () => {
    const filas = filtradas.map((v) => ({
      Fecha: formatearFechaCorta(v.fecha),
      Cliente: v.clienteNombre,
      Producto: v.productoNombre,
      Cantidad: v.cantidad,
      'Precio Unit.': v.montoPagado && v.cantidad ? Math.round(v.total / v.cantidad) : 0,
      Total: v.total,
      Pagado: v.montoPagado ?? 0,
      Pendiente: v.total - (v.montoPagado ?? 0),
      'Tipo de Pago': v.tipoPago,
      Estado: v.estadoPago,
    }));
    descargarCSV(nombreArchivo('ventas'), generarCSV(filas));
    setToast(`Exportadas ${filas.length} ventas a CSV.`);
    setTimeout(() => setToast(null), 3000);
  };

  const filtrosActivos =
    !!busqueda || filtroEstado !== 'Todos' || filtroTipoPago !== 'Todos' || !!filtroDesde || !!filtroHasta;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800">Ventas</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtradas.length} de {ventas.length} ventas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargar}
            className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg"
          >
            ↻ Actualizar
          </button>
          {filtradas.length > 0 && (
            <button
              onClick={exportarCSV}
              className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium shadow-sm"
            >
              📥 <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Total filtrado</div>
          <div className="text-xl font-bold text-slate-800">{formatearARS(totales.total)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Cobrado</div>
          <div className="text-xl font-bold text-emerald-700">{formatearARS(totales.pagado)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Pendiente</div>
          <div className={`text-xl font-bold ${totales.pendiente > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
            {formatearARS(totales.pendiente)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 space-y-3">
        <input
          type="text"
          placeholder="Buscar por cliente o producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoFiltro)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Parcial">Parcial</option>
            <option value="Pendiente">Pendiente</option>
          </select>
          <select
            value={filtroTipoPago}
            onChange={(e) => setFiltroTipoPago(e.target.value as TipoPagoFiltro)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="Todos">Todos los tipos de pago</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="CuentaCorriente">Cta. Cte.</option>
          </select>
          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            title="Desde"
          />
          <input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            title="Hasta"
          />
          {filtrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="text-xs text-brand-600 hover:underline self-center"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Producto</th>
                <th className="text-center px-4 py-3 font-medium">Cant.</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Tipo</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    {ventas.length === 0 ? 'Sin ventas registradas.' : 'Sin resultados con los filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filtradas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatearFechaCorta(v.fecha)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{v.clienteNombre}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{v.productoNombre}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{v.cantidad}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatearARS(v.total)}
                    </td>
                    <td className="px-4 py-3 text-center">{badgeTipoPago(v.tipoPago)}</td>
                    <td className="px-4 py-3 text-center">{badgeEstado(v.estadoPago)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};