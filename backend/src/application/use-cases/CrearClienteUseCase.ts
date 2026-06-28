import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { Cliente } from '../../domain/entities/Cliente';
import { randomUUID } from 'crypto';

export interface CrearClienteInput {
  nombre: string;
  telefono: string;
  notasPersonales?: string;
  etiquetas?: string[];
}

export class TelefonoDuplicadoError extends Error {}

export class CrearClienteUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute(input: CrearClienteInput): Promise<Cliente> {
    if (!input.nombre?.trim()) throw new Error('El nombre es obligatorio');
    if (!input.telefono?.trim()) throw new Error('El telefono es obligatorio');

    const telLimpio = input.telefono.replace(/[^0-9]/g, '');
    const existentes = await this.clienteRepo.listar();
    const duplicado = existentes.find(
      (c) => c.telefono.replace(/[^0-9]/g, '') === telLimpio
    );
    if (duplicado) throw new TelefonoDuplicadoError(`Ya existe el cliente ${duplicado.nombre} con ese telefono`);

    const cliente: Cliente = {
      id: randomUUID(),
      nombre: input.nombre.trim(),
      telefono: input.telefono.trim(),
      historialCompras: [],
      notasPersonales: input.notasPersonales?.trim() ?? '',
      saldoDeudor: 0,
      activo: true,
      etiquetas: (input.etiquetas ?? []).map((t) => t.trim()).filter(Boolean),
    };
    await this.clienteRepo.guardar(cliente);
    return cliente;
  }
}