import { Perfume } from '../entities/Perfume';

export interface IPerfumeRepository {
  listar(): Promise<Perfume[]>;
  obtenerPorId(id: string): Promise<Perfume | null>;
  guardar(perfume: Perfume): Promise<void>;
  actualizar(perfume: Perfume): Promise<void>;
  descontarStock(id: string, cantidad: number): Promise<Perfume>;
  buscar(texto: string): Promise<Perfume[]>;
}