import type {
  Cliente,
  ClienteRecompra,
  Configuracion,
  DashboardMetrics,
  FichaCliente,
  PagoResultado,
  Perfume,
  TipoPago,
  Venta,
  VentaListada,
} from '../types/domain';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la peticion');
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDashboardMetrics: () => request<DashboardMetrics>('/dashboard/metrics'),
  getAlertasStock: () => request<Perfume[]>('/dashboard/alertas-stock'),

  listarPerfumes: (filtros: { busqueda?: string; marca?: string; fragancia?: string } = {}) => {
    const params = new URLSearchParams();
    if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
    if (filtros.marca) params.set('marca', filtros.marca);
    if (filtros.fragancia) params.set('fragancia', filtros.fragancia);
    const qs = params.toString();
    return request<Perfume[]>(`/perfumes${qs ? `?${qs}` : ''}`);
  },

  listarVentas: () => request<VentaListada[]>('/ventas'),

  registrarVenta: (payload: {
    clienteId: string;
    productoId: string;
    cantidad: number;
    tipoPago: TipoPago;
  }) =>
    request<{ venta: Venta; alertaReposicion: boolean; stockRestante: number }>('/ventas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listarClientes: (opts: { conDeuda?: boolean; incluirInactivos?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (opts.conDeuda) params.set('conDeuda', 'true');
    if (opts.incluirInactivos) params.set('incluirInactivos', 'true');
    const qs = params.toString();
    return request<Cliente[]>(`/clientes${qs ? `?${qs}` : ''}`);
  },
  crearCliente: (payload: {
    nombre: string;
    telefono: string;
    notasPersonales?: string;
    etiquetas?: string[];
  }) => request<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarCliente: (
    id: string,
    payload: { nombre?: string; telefono?: string; notasPersonales?: string; etiquetas?: string[] }
  ) => request<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  eliminarCliente: (id: string) => request<{ ok: boolean }>(`/clientes/${id}`, { method: 'DELETE' }),
  getFichaCliente: (id: string) => request<FichaCliente>(`/clientes/${id}/ficha`),
  registrarPago: (id: string, payload: { monto: number; nota?: string }) =>
    request<PagoResultado>(`/clientes/${id}/pagos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getClientesRecontacto: () => request<ClienteRecompra[]>('/clientes/recontacto'),

  getConfiguracion: () => request<Configuracion>('/configuracion'),
  updateConfiguracion: (payload: Partial<Configuracion>) =>
    request<Configuracion>('/configuracion', { method: 'PUT', body: JSON.stringify(payload) }),
};