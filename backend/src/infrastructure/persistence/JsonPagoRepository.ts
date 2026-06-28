import { Pago } from '../../domain/entities/Pago';
import { IPagoRepository } from '../../domain/repositories/IPagoRepository';
import { cargarDB, guardarDB } from './jsonStore';

export class JsonPagoRepository implements IPagoRepository {
  async listar(): Promise<Pago[]> {
    const db = cargarDB();
    return db.pagos as Pago[];
  }

  async listarPorCliente(clienteId: string): Promise<Pago[]> {
    const db = cargarDB();
    return (db.pagos as Pago[]).filter((p) => p.clienteId === clienteId);
  }

  async guardar(pago: Pago): Promise<void> {
    const db = cargarDB();
    db.pagos.push(pago);
    guardarDB(db);
  }
}