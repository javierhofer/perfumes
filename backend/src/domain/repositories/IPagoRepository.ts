import { Pago } from '../entities/Pago';

export interface IPagoRepository {
  listar(): Promise<Pago[]>;
  listarPorCliente(clienteId: string): Promise<Pago[]>;
  guardar(pago: Pago): Promise<void>;
}