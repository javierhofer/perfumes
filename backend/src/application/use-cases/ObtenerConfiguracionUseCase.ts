import { IConfiguracionRepository } from '../../domain/repositories/IConfiguracionRepository';

export class ObtenerConfiguracionUseCase {
  constructor(private readonly repo: IConfiguracionRepository) {}

  async execute() {
    return this.repo.obtener();
  }
}