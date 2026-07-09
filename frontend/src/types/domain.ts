export type TipoPerfume = 'EDT' | 'EDP' | 'Parfum' | 'Colonia';
export type TipoPago = 'Efectivo' | 'Transferencia' | 'CuentaCorriente';
export type EstadoPago = 'Pagado' | 'Pendiente' | 'Parcial';

export interface Perfume {
  id: string;
  marca: string;
  fragancia: string;
  tipo: TipoPerfume;
  mililitros: number;
  stock: number;
  precioCosto: number;
  precioVenta: number;
  margen: number;
  alertaCritica: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  historialCompras: string[];
  notasPersonales: string;
  saldoDeudor: number;
  activo: boolean;
  etiquetas: string[];
}

export interface Venta {
  id: string;
  clienteId: string;
  productoId: string;
  cantidad: number;
  fecha: string;
  tipoPago: TipoPago;
  estadoPago: EstadoPago;
  montoPagado: number;
  precioUnitario: number;
  costoUnitario: number;
  total: number;
}

export interface VentaListada {
  id: string;
  clienteNombre: string;
  productoNombre: string;
  cantidad: number;
  total: number;
  montoPagado: number;
  fecha: string;
  tipoPago: string;
  estadoPago: string;
}

export interface DashboardMetrics {
  ventasTotales: number;
  gananciaNeta: number;
  totalFraganciasEnStock: number;
  cuentasPorCobrar: number;
  ventasUltimos30Dias: { fecha: string; total: number }[];
}

export interface ClienteRecompra {
  clienteId: string;
  nombre: string;
  telefono: string;
  perfumeNombre: string;
  ultimaCompraFecha: string;
  diasSinComprar: number;
  whatsappUrl: string;
}

export interface FichaCliente {
  cliente: {
    id: string;
    nombre: string;
    telefono: string;
    notasPersonales: string;
    saldoDeudor: number;
    activo: boolean;
    etiquetas: string[];
    cantidadCompras: number;
    totalGastado: number;
    primeraCompra: string | null;
    ultimaCompra: string | null;
  };
  ventas: {
    id: string;
    fecha: string;
    productoNombre: string;
    cantidad: number;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
    tipoPago: string;
    estadoPago: string;
  }[];
  pagos: {
    id: string;
    fecha: string;
    monto: number;
    nota?: string;
    ventasAfectadas: { ventaId: string; montoAplicado: number }[];
  }[];
  deudaTotal: number;
}

export interface PagoResultado {
  pago: {
    id: string;
    clienteId: string;
    monto: number;
    fecha: string;
    nota?: string;
    ventasAfectadas: { ventaId: string; montoAplicado: number }[];
  };
  ventasActualizadas: { ventaId: string; montoAplicado: number; nuevoEstado: string }[];
  saldoRestante: number;
}

export type Moneda = 'ARS' | 'USD' | 'EUR';
export type TemaVisual = 'claro' | 'oscuro';
export type Idioma = 'es' | 'en';
export type IdiomaBot = 'auto' | 'es' | 'en';

export interface EtiquetaConfig {
  nombre: string;
  color: string;
}

export interface DatosNegocio {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  cuit: string;
}

export interface NumeracionTickets {
  prefijo: string;
  siguiente: number;
}

export interface Configuracion {
  umbralStockCritico: number;
  umbralDeudaCritica: number;
  diasRecompra: number;
  datosNegocio: DatosNegocio;
  etiquetasPersonalizadas: EtiquetaConfig[];
  plantillaWhatsapp: string;
  canalRespaldoTexto: string;
  moneda: Moneda;
  simboloMoneda: string;
  temaVisual: TemaVisual;
  idioma: Idioma;
  idiomaBot: IdiomaBot;
  notificacionesActivas: boolean;
  numeracionTickets: NumeracionTickets;
}