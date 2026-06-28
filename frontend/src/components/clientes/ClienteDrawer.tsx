import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import type { FichaCliente, Perfume, TipoPago } from '../../types/domain';
import { formatearARS, formatearFechaCorta, formatearFechaLarga } from '../../hooks/formato';
import { esDeudaCritica, UMBRAL_DEUDA_CRITICA, formatearUmbral } from '../../hooks/deudaCritica';
import { RegistrarPagoModal } from './RegistrarPagoModal';
import { ClienteFormModal } from './ClienteFormModal';
import { EliminarClienteModal } from './EliminarClienteModal';
import { QuickSaleModal } from '../inventario/QuickSaleModal';
import { TagsReadonly } from './TagsSelector';
import { generarCSV, descargarCSV, nombreArchivo } from '../../utils/csv';

interface ClienteDrawerProps {
  clienteId: string;
  onClose: () => void;
  onChange: () => void;
}

const badgeEstado = (estado: string) => {
  if (estado === 'Pagado')
    return <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">PAGADO</span>;
  if (estado === 'Parcial')
    return <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">PARCIAL</span>;
  return <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">PENDIENTE</span>;
};

export const ClienteDrawer = ({ clienteId, onClose, onChange }: ClienteDrawerProps) => {
  const [ficha, setFicha] = useState<FichaCliente | null>(null);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPago, setShowPago] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSale, setShowSale] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Pagado' | 'Pendiente' | 'Parcial'>('Todos');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroMontoMin, setFiltroMontoMin] = useState('');

  const [expandedPagos, setExpandedPagos] = useState<Set<string>>(new Set());

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, p] = await Promise.all([api.getFichaCliente(clienteId), api.listarPerfumes()]);
      setFicha(f);
      setPerfumes(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [clienteId]);

  const ventasFiltradas = useMemo(() => {
    if (!ficha) return [];
    return ficha.ventas.filter((v) => {
      if (filtroEstado !== 'Todos' && v.estadoPago !== filtroEstado) return false;
      const fecha = v.fecha.substring(0, 10);
      if (filtroDesde && fecha < filtroDesde) return false;
      if (filtroHasta && fecha > filtroHasta) return false;
      if (filtroMontoMin && v.total < Number(filtroMontoMin)) return false;
      return true;
    });
  }, [ficha, filtroEstado, filtroDesde, filtroHasta, filtroMontoMin]);

  const limpiarFiltros = () => {
    setFiltroEstado('Todos');
    setFiltroDesde('');
    setFiltroHasta('');
    setFiltroMontoMin('');
  };

  const handlePago = async (monto: number, nota: string) => {
    await api.registrarPago(clienteId, { monto, nota });
    setShowPago(false);
    await cargar();
    onChange();
  };

  const handleGuardarEdicion = async (data: { nombre: string; telefono: string; notasPersonales: string; etiquetas: string[] }) => {
    await api.actualizarCliente(clienteId, data);
    setShowEdit(false);
    await cargar();
    onChange();
  };

  const handleConfirmarEliminar = async () => {
    await api.eliminarCliente(clienteId);
    onChange();
    onClose();
  };

  const handleVenta = async (data: { clienteId: string; cantidad: number; tipoPago: TipoPago }) => {
    if (!perfumeVentaId) return;
    await api.registrarVenta({
      clienteId: ficha!.cliente.id,
      productoId: perfumeVentaId,
      cantidad: data.cantidad,
      tipoPago: data.tipoPago,
    });
    setShowSale(false);
    setPerfumeVentaId(null);
    await cargar();
    onChange();
  };

  const [perfumeVentaId, setPerfumeVentaId] = useState<string | null>(null);
  const perfumeParaVenta = useMemo(
    () => (perfumeVentaId ? perfumes.find((p) => p.id === perfumeVentaId) ?? null : null),
    [perfumeVentaId, perfumes]
  );

  const togglePagoExpandido = (id: string) => {
    const nuevo = new Set(expandedPagos);
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    setExpandedPagos(nuevo);
  };

  const exportarComprasCSV = () => {
    if (!ficha) return;
    const filas = ficha.ventas.map((v) => ({
      Fecha: formatearFechaLarga(v.fecha),
      Producto: v.productoNombre,
      Cantidad: v.cantidad,
      'Tipo de Pago': v.tipoPago,
      Estado: v.estadoPago,
      Total: v.total,
      Pagado: v.montoPagado,
      'Saldo Pendiente': v.saldoPendiente,
    }));
    descargarCSV(nombreArchivo('cliente-compras', ficha.cliente.nombre), generarCSV(filas));
  };

  const exportarPagosCSV = () => {
    if (!ficha) return;
    const filas = ficha.pagos.map((p) => {
      const detalleVentas = p.ventasAfectadas
        .map((va) => {
          const venta = ficha.ventas.find((v) => v.id === va.ventaId);
          return `${venta?.productoNombre ?? va.ventaId} (${va.montoAplicado})`;
        })
        .join(' | ');
      return {
        Fecha: formatearFechaLarga(p.fecha),
        Monto: p.monto,
        Nota: p.nota ?? '',
        'Ventas Afectadas': detalleVentas,
      };
    });
    descargarCSV(nombreArchivo('cliente-pagos', ficha.cliente.nombre), generarCSV(filas));
  };

  const handleImprimir = () => {
    window.print();
  };

  const deudaCritica = ficha ? esDeudaCritica(ficha.deudaTotal) : false;
  const filtrosActivos =
    filtroEstado !== 'Todos' || !!filtroDesde || !!filtroHasta || !!filtroMontoMin;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-40 no-print" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col drawer-print">
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between no-print">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Ficha del cliente</div>
            <h2 className="font-semibold text-lg truncate">{ficha?.cliente.nombre ?? '...'}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="hidden print:block px-5 py-4 border-b border-slate-300 bg-slate-100">
          <div className="text-xs uppercase tracking-wider text-slate-600">Perfumes Manager · Ficha de cliente</div>
          <h1 className="text-xl font-bold text-slate-800">{ficha?.cliente.nombre}</h1>
          <div className="text-xs text-slate-500 mt-1">Impreso: {new Date().toLocaleString('es-AR')}</div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm no-print">
            Cargando ficha...
          </div>
        ) : error ? (
          <div className="p-5 no-print">
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          </div>
        ) : ficha ? (
          <>
            <div className="px-5 py-4 border-b border-slate-100 space-y-3 overflow-y-auto max-h-[60vh] no-print">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {ficha.cliente.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500">Telefono</div>
                  <a
                    href={`https://wa.me/${ficha.cliente.telefono.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:underline font-medium"
                  >
                    {ficha.cliente.telefono}
                  </a>
                </div>
              </div>

              {ficha.cliente.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ficha.cliente.etiquetas.map((t) => (
                    <span
                      key={t}
                      className="inline-block text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {ficha.cliente.notasPersonales && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 italic">
                  "{ficha.cliente.notasPersonales}"
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-50 rounded-lg py-2">
                  <div className="text-slate-500">Compras</div>
                  <div className="font-semibold text-slate-800 text-base">{ficha.cliente.cantidadCompras}</div>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <div className="text-slate-500">Total $</div>
                  <div className="font-semibold text-slate-800 text-sm truncate">
                    {(ficha.cliente.totalGastado / 1000).toFixed(0)}k
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <div className="text-slate-500">Primera</div>
                  <div className="font-semibold text-slate-800">
                    {ficha.cliente.primeraCompra ? formatearFechaCorta(ficha.cliente.primeraCompra) : '—'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <div className="text-slate-500">Ultima</div>
                  <div className="font-semibold text-slate-800">
                    {ficha.cliente.ultimaCompra ? formatearFechaCorta(ficha.cliente.ultimaCompra) : '—'}
                  </div>
                </div>
              </div>

              {deudaCritica && ficha.deudaTotal > 0 && (
                <div className="bg-rose-50 border-l-4 border-rose-600 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-xl">🚨</span>
                  <div className="text-xs">
                    <div className="font-semibold text-rose-800">Deuda critica</div>
                    <div className="text-rose-700 mt-0.5">
                      Supera el umbral de {formatearUmbral()}. Considera contactar al cliente para
                      regularizar.
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`rounded-lg p-4 ${
                  ficha.deudaTotal > 0
                    ? 'bg-rose-50 border border-rose-200'
                    : 'bg-emerald-50 border border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-slate-500">Saldo Deudor Total</div>
                    <div
                      className={`text-2xl font-bold ${
                        ficha.deudaTotal > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatearARS(ficha.deudaTotal)}
                    </div>
                    {deudaCritica && (
                      <div className="text-[10px] text-rose-700 font-medium mt-0.5">
                        Umbral: {formatearUmbral()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {ficha.deudaTotal > 0 && (
                      <button
                        onClick={() => setShowPago(true)}
                        className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm whitespace-nowrap"
                      >
                        💰 Registrar Pago
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const primerPerfumeConStock = perfumes.find((p) => p.stock > 0);
                        if (primerPerfumeConStock) {
                          setPerfumeVentaId(primerPerfumeConStock.id);
                          setShowSale(true);
                        } else {
                          alert('No hay perfumes con stock disponible.');
                        }
                      }}
                      className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm whitespace-nowrap"
                      title="Iniciar una venta con este cliente preseleccionado"
                    >
                      ⚡ Nueva Venta
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex-1 text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg"
                >
                  ✎ Editar
                </button>
                <button
                  onClick={handleImprimir}
                  className="flex-1 text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg"
                  title="Imprimir ficha (vista limpia)"
                >
                  🖨️ Imprimir
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex-1 text-xs border border-rose-200 hover:bg-rose-50 text-rose-700 px-3 py-2 rounded-lg"
                >
                  Dar de baja
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto print:overflow-visible">
              <section className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Historial de Compras
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {ventasFiltradas.length} / {ficha.ventas.length}
                    </span>
                    {ficha.ventas.length > 0 && (
                      <button
                        onClick={exportarComprasCSV}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium"
                        title="Descargar CSV con todas las compras"
                      >
                        📥 CSV
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2 mb-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value as any)}
                      className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                    >
                      <option value="Todos">Todos los estados</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      placeholder="$ min"
                      value={filtroMontoMin}
                      onChange={(e) => setFiltroMontoMin(e.target.value)}
                      className="w-20 text-xs border border-slate-300 rounded px-2 py-1.5"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={filtroDesde}
                      onChange={(e) => setFiltroDesde(e.target.value)}
                      className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5"
                    />
                    <span className="text-xs text-slate-400">a</span>
                    <input
                      type="date"
                      value={filtroHasta}
                      onChange={(e) => setFiltroHasta(e.target.value)}
                      className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5"
                    />
                    {filtrosActivos && (
                      <button
                        onClick={limpiarFiltros}
                        className="text-[10px] text-brand-600 hover:underline whitespace-nowrap"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {ventasFiltradas.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">
                    {ficha.ventas.length === 0
                      ? 'Sin compras registradas.'
                      : 'Sin resultados con los filtros aplicados.'}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {ventasFiltradas.map((v) => (
                      <li key={v.id} className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-slate-800 truncate">
                              {v.productoNombre}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatearFechaLarga(v.fecha)} · x{v.cantidad} · {v.tipoPago}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-slate-800">
                              {formatearARS(v.total)}
                            </div>
                            {v.saldoPendiente > 0 && (
                              <div className="text-[10px] text-rose-600 font-medium">
                                debe {formatearARS(v.saldoPendiente)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-1.5">{badgeEstado(v.estadoPago)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {ficha.pagos.length > 0 && (
                <section className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Pagos Registrados ({ficha.pagos.length})
                    </h3>
                    <button
                      onClick={exportarPagosCSV}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium"
                      title="Descargar CSV con todos los pagos"
                    >
                      📥 CSV
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {ficha.pagos.map((p) => {
                      const expanded = expandedPagos.has(p.id);
                      return (
                        <li key={p.id} className="bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden">
                          <button
                            onClick={() => togglePagoExpandido(p.id)}
                            className="w-full p-3 text-left hover:bg-emerald-100/60 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-slate-600">{formatearFechaLarga(p.fecha)}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-emerald-700">
                                  -{formatearARS(p.monto)}
                                </div>
                                <span
                                  className={`text-emerald-600 text-xs transition-transform ${
                                    expanded ? 'rotate-180' : ''
                                  }`}
                                >
                                  ▼
                                </span>
                              </div>
                            </div>
                            {p.nota && !expanded && (
                              <div className="text-[11px] text-slate-500 mt-1 italic truncate">"{p.nota}"</div>
                            )}
                          </button>
                          {expanded && (
                            <div className="px-3 pb-3 border-t border-emerald-100/80 space-y-1">
                              {p.ventasAfectadas.length > 0 && (
                                <div className="text-[11px] text-emerald-800 mt-2 space-y-0.5">
                                  <div className="font-semibold uppercase tracking-wider text-[10px] mb-1">
                                    Aplicado a:
                                  </div>
                                  {p.ventasAfectadas.map((va) => {
                                    const venta = ficha.ventas.find((v) => v.id === va.ventaId);
                                    return (
                                      <div key={va.ventaId} className="flex justify-between gap-2">
                                        <span className="truncate">→ {venta?.productoNombre ?? va.ventaId}</span>
                                        <span className="font-semibold whitespace-nowrap">
                                          {formatearARS(va.montoAplicado)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {p.nota && (
                                <div className="text-[11px] text-slate-500 italic mt-1">"{p.nota}"</div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          </>
        ) : null}
      </aside>

      {showPago && ficha && (
        <RegistrarPagoModal
          clienteNombre={ficha.cliente.nombre}
          saldoActual={ficha.deudaTotal}
          onClose={() => setShowPago(false)}
          onConfirm={handlePago}
        />
      )}

      {showEdit && ficha && (
        <ClienteFormModal
          cliente={{
            id: ficha.cliente.id,
            nombre: ficha.cliente.nombre,
            telefono: ficha.cliente.telefono,
            historialCompras: [],
            notasPersonales: ficha.cliente.notasPersonales,
            saldoDeudor: ficha.cliente.saldoDeudor,
            activo: ficha.cliente.activo,
            etiquetas: ficha.cliente.etiquetas,
          }}
          onClose={() => setShowEdit(false)}
          onSave={handleGuardarEdicion}
        />
      )}

      {showDelete && ficha && (
        <EliminarClienteModal
          cliente={{
            id: ficha.cliente.id,
            nombre: ficha.cliente.nombre,
            telefono: ficha.cliente.telefono,
            historialCompras: [],
            notasPersonales: ficha.cliente.notasPersonales,
            saldoDeudor: ficha.cliente.saldoDeudor,
            activo: ficha.cliente.activo,
            etiquetas: ficha.cliente.etiquetas,
          }}
          onClose={() => setShowDelete(false)}
          onConfirm={handleConfirmarEliminar}
        />
      )}

      {showSale && ficha && perfumeParaVenta && (
        <QuickSaleModal
          perfume={perfumeParaVenta}
          clientes={[
            {
              id: ficha.cliente.id,
              nombre: ficha.cliente.nombre,
              telefono: ficha.cliente.telefono,
              historialCompras: [],
              notasPersonales: '',
              saldoDeudor: 0,
              activo: true,
              etiquetas: [],
            },
          ]}
          preselectedClienteId={ficha.cliente.id}
          onClose={() => {
            setShowSale(false);
            setPerfumeVentaId(null);
          }}
          onConfirm={handleVenta}
        />
      )}
    </>
  );
};