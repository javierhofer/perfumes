import { Cliente } from '../../domain/entities/Cliente';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { cargarDB, guardarDB } from './jsonStore';

export class JsonClienteRepository implements IClienteRepository {
  async listar(soloActivos = true): Promise<Cliente[]> {
    const db = cargarDB();
    const clientes = db.clientes as Cliente[];
    return soloActivos ? clientes.filter((c) => c.activo !== false) : clientes;
  }

  async listarConDeuda(): Promise<Cliente[]> {
    const db = cargarDB();
    return (db.clientes as Cliente[]).filter((c) => c.activo !== false && c.saldoDeudor > 0);
  }

  async obtenerPorId(id: string): Promise<Cliente | null> {
    const db = cargarDB();
    return (db.clientes.find((c) => c.id === id) as Cliente) ?? null;
  }

  async guardar(cliente: Cliente): Promise<void> {
    const db = cargarDB();
    const idx = db.clientes.findIndex((c) => c.id === cliente.id);
    if (idx >= 0) db.clientes[idx] = cliente;
    else db.clientes.push(cliente);
    guardarDB(db);
  }

  async actualizar(cliente: Cliente): Promise<void> {
    return this.guardar(cliente);
  }

  async eliminar(id: string): Promise<void> {
    const db = cargarDB();
    const idx = db.clientes.findIndex((c) => c.id === id);
    if (idx < 0) return;
    db.clientes[idx].activo = false;
    guardarDB(db);
  }
}