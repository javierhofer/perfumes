import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';
import { IConfiguracionRepository } from '../../domain/repositories/IConfiguracionRepository';
import { PerfumeDTO } from '../dtos/PerfumeDTO';

export class ObtenerAlertasStockUseCase {
  constructor(
    private readonly perfumeRepo: IPerfumeRepository,
    private readonly configRepo: IConfiguracionRepository
  ) {}

  async execute(): Promise<PerfumeDTO[]> {
    const [perfumes, config] = await Promise.all([
      this.perfumeRepo.listar(),
      this.configRepo.obtener(),
    ]);
    const umbral = config.umbralStockCritico;
    return perfumes
      .filter((p) => p.stock <= umbral)
      .map((p) => ({
        id: p.id,
        marca: p.marca,
        fragancia: p.fragancia,
        tipo: p.tipo,
        mililitros: p.mililitros,
        stock: p.stock,
        precioCosto: p.precioCosto,
        precioVenta: p.precioVenta,
        margen: p.precioVenta - p.precioCosto,
        alertaCritica: true,
      }))
      .sort((a, b) => a.stock - b.stock);
  }
}