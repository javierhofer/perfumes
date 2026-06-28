import { Venta } from '../entities/Venta';

export interface IVentaRepository {
  listar(): Promise<Venta[]>;
  guardar(venta: Venta): Promise<void>;
  actualizar(venta: Venta): Promise<void>;
  obtenerPorCliente(clienteId: string): Promise<Venta[]>;
}