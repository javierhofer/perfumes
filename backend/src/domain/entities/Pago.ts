export interface Pago {
  id: string;
  clienteId: string;
  monto: number;
  fecha: string;
  nota?: string;
  ventasAfectadas: { ventaId: string; montoAplicado: number }[];
}