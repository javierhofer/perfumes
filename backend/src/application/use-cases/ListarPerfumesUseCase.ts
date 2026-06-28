import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';
import { PerfumeDTO } from '../dtos/PerfumeDTO';

export interface ListarPerfumesInput {
  busqueda?: string;
  marca?: string;
  fragancia?: string;
}

export class ListarPerfumesUseCase {
  constructor(private readonly perfumeRepo: IPerfumeRepository) {}

  async execute(filtros: ListarPerfumesInput = {}): Promise<PerfumeDTO[]> {
    let perfumes = await this.perfumeRepo.listar();

    if (filtros.marca) {
      perfumes = perfumes.filter((p) => p.marca.toLowerCase() === filtros.marca!.toLowerCase());
    }
    if (filtros.fragancia) {
      perfumes = perfumes.filter(
        (p) => p.fragancia.toLowerCase() === filtros.fragancia!.toLowerCase()
      );
    }
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      perfumes = perfumes.filter(
        (p) =>
          p.marca.toLowerCase().includes(q) ||
          p.fragancia.toLowerCase().includes(q) ||
          p.tipo.toLowerCase().includes(q)
      );
    }

    return perfumes.map((p) => ({
      id: p.id,
      marca: p.marca,
      fragancia: p.fragancia,
      tipo: p.tipo,
      mililitros: p.mililitros,
      stock: p.stock,
      precioCosto: p.precioCosto,
      precioVenta: p.precioVenta,
      margen: p.precioVenta - p.precioCosto,
      alertaCritica: p.stock <= 3,
    }));
  }
}