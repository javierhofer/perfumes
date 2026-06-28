import { IClienteRepository } from '../../domain/repositories/IClienteRepository';

export interface ActualizarClienteInput {
  id: string;
  nombre?: string;
  telefono?: string;
  notasPersonales?: string;
  etiquetas?: string[];
}

export class ClienteNoEncontradoError extends Error {}

export class ActualizarClienteUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute(input: ActualizarClienteInput) {
    const cliente = await this.clienteRepo.obtenerPorId(input.id);
    if (!cliente) throw new ClienteNoEncontradoError(`Cliente ${input.id} no existe`);

    if (input.nombre !== undefined) cliente.nombre = input.nombre.trim();
    if (input.telefono !== undefined) cliente.telefono = input.telefono.trim();
    if (input.notasPersonales !== undefined) cliente.notasPersonales = input.notasPersonales.trim();
    if (input.etiquetas !== undefined) cliente.etiquetas = input.etiquetas.map((t) => t.trim()).filter(Boolean);

    await this.clienteRepo.actualizar(cliente);
    return cliente;
  }
}