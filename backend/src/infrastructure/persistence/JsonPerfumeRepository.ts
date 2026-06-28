import { Perfume } from '../../domain/entities/Perfume';
import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';
import { cargarDB, guardarDB } from './jsonStore';

export class JsonPerfumeRepository implements IPerfumeRepository {
  async listar(): Promise<Perfume[]> {
    const db = cargarDB();
    return db.perfumes as Perfume[];
  }

  async obtenerPorId(id: string): Promise<Perfume | null> {
    const db = cargarDB();
    return (db.perfumes.find((p) => p.id === id) as Perfume) ?? null;
  }

  async guardar(perfume: Perfume): Promise<void> {
    const db = cargarDB();
    const idx = db.perfumes.findIndex((p) => p.id === perfume.id);
    if (idx >= 0) db.perfumes[idx] = perfume;
    else db.perfumes.push(perfume);
    guardarDB(db);
  }

  async actualizar(perfume: Perfume): Promise<void> {
    return this.guardar(perfume);
  }

  async descontarStock(id: string, cantidad: number): Promise<Perfume> {
    const db = cargarDB();
    const idx = db.perfumes.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Perfume ${id} no encontrado`);
    const perfume = db.perfumes[idx] as Perfume;
    perfume.stock = Math.max(0, perfume.stock - cantidad);
    db.perfumes[idx] = perfume;
    guardarDB(db);
    return perfume;
  }

  async buscar(texto: string): Promise<Perfume[]> {
    const db = cargarDB();
    const q = texto.toLowerCase();
    return (db.perfumes as Perfume[]).filter(
      (p) =>
        p.marca.toLowerCase().includes(q) ||
        p.fragancia.toLowerCase().includes(q) ||
        p.tipo.toLowerCase().includes(q)
    );
  }
}