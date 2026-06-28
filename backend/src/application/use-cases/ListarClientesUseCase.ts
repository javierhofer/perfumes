import { IClienteRepository } from '../../domain/repositories/IClienteRepository';

export class ListarClientesUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute() {
    return this.clienteRepo.listar();
  }
}