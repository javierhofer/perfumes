import { Cliente } from '../entities/Cliente';

export interface IClienteRepository {
  listar(soloActivos?: boolean): Promise<Cliente[]>;
  listarConDeuda(): Promise<Cliente[]>;
  obtenerPorId(id: string): Promise<Cliente | null>;
  guardar(cliente: Cliente): Promise<void>;
  actualizar(cliente: Cliente): Promise<void>;
  eliminar(id: string): Promise<void>;
}