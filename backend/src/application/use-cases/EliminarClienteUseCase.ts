import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { IVentaRepository } from '../../domain/repositories/IVentaRepository';

export class EliminarClienteUseCase {
  constructor(
    private readonly clienteRepo: IClienteRepository,
    private readonly ventaRepo: IVentaRepository
  ) {}

  async execute(id: string) {
    const cliente = await this.clienteRepo.obtenerPorId(id);
    if (!cliente) throw new Error(`Cliente ${id} no existe`);

    cliente.activo = false;
    await this.clienteRepo.actualizar(cliente);
    return cliente;
  }
}