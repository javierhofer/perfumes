export type TipoPago = 'Efectivo' | 'Transferencia' | 'CuentaCorriente';
export type EstadoPago = 'Pagado' | 'Pendiente' | 'Parcial';

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