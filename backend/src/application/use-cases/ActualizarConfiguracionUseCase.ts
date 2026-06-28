import { IConfiguracionRepository } from '../../domain/repositories/IConfiguracionRepository';
import { Configuracion, CONFIG_DEFAULT } from '../../domain/entities/Configuracion';

export class ActualizarConfiguracionUseCase {
  constructor(private readonly repo: IConfiguracionRepository) {}

  async execute(parcial: Partial<Configuracion>) {
    const actual = await this.repo.obtener();
    const merged: Configuracion = {
      ...actual,
      ...parcial,
      datosNegocio: { ...actual.datosNegocio, ...(parcial.datosNegocio ?? {}) },
      numeracionTickets: { ...actual.numeracionTickets, ...(parcial.numeracionTickets ?? {}) },
    };
    if (merged.umbralStockCritico < 0) merged.umbralStockCritico = 0;
    if (merged.umbralDeudaCritica < 0) merged.umbralDeudaCritica = 0;
    if (merged.diasRecompra < 1) merged.diasRecompra = 1;
    await this.repo.guardar(merged);
    return merged;
  }
}