import { Venta } from '../../domain/entities/Venta';
import { IVentaRepository } from '../../domain/repositories/IVentaRepository';
import { cargarDB, guardarDB } from './jsonStore';

export class JsonVentaRepository implements IVentaRepository {
  async listar(): Promise<Venta[]> {
    const db = cargarDB();
    return db.ventas as Venta[];
  }

  async guardar(venta: Venta): Promise<void> {
    const db = cargarDB();
    db.ventas.push(venta);
    guardarDB(db);
  }

  async actualizar(venta: Venta): Promise<void> {
    const db = cargarDB();
    const idx = db.ventas.findIndex((v) => v.id === venta.id);
    if (idx < 0) throw new Error(`Venta ${venta.id} no encontrada`);
    db.ventas[idx] = { ...db.ventas[idx], ...venta };
    guardarDB(db);
  }

  async obtenerPorCliente(clienteId: string): Promise<Venta[]> {
    const db = cargarDB();
    return (db.ventas as Venta[]).filter((v) => v.clienteId === clienteId);
  }
}