import { Perfume } from '../../domain/entities/Perfume';
import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';
import { IVentaRepository } from '../../domain/repositories/IVentaRepository';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { TipoPago, EstadoPago, Venta } from '../../domain/entities/Venta';
import { randomUUID } from 'crypto';

export interface RegistrarVentaInput {
  clienteId: string;
  productoId: string;
  cantidad: number;
  tipoPago: TipoPago;
}

export interface RegistrarVentaOutput {
  venta: Venta;
  alertaReposicion: boolean;
  stockRestante: number;
}

export class StockInsuficienteError extends Error {
  constructor(public stockActual: number, public cantidadSolicitada: number) {
    super(`Stock insuficiente: hay ${stockActual} y se pidieron ${cantidadSolicitada}`);
  }
}

export class ClienteNoEncontradoError extends Error {}
export class PerfumeNoEncontradoError extends Error {}

export class RegistrarVentaUseCase {
  constructor(
    private readonly perfumeRepo: IPerfumeRepository,
    private readonly clienteRepo: IClienteRepository,
    private readonly ventaRepo: IVentaRepository
  ) {}

  async execute(input: RegistrarVentaInput): Promise<RegistrarVentaOutput> {
    if (input.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const cliente = await this.clienteRepo.obtenerPorId(input.clienteId);
    if (!cliente) throw new ClienteNoEncontradoError(`Cliente ${input.clienteId} no existe`);

    const perfume = await this.perfumeRepo.obtenerPorId(input.productoId);
    if (!perfume) throw new PerfumeNoEncontradoError(`Perfume ${input.productoId} no existe`);

    if (perfume.stock < input.cantidad) {
      throw new StockInsuficienteError(perfume.stock, input.cantidad);
    }

    const perfumeActualizado = await this.perfumeRepo.descontarStock(perfume.id, input.cantidad);

    const estadoPago: EstadoPago = input.tipoPago === 'CuentaCorriente' ? 'Pendiente' : 'Pagado';
    const total = perfume.precioVenta * input.cantidad;

    const venta: Venta = {
      id: randomUUID(),
      clienteId: cliente.id,
      productoId: perfume.id,
      cantidad: input.cantidad,
      fecha: new Date().toISOString(),
      tipoPago: input.tipoPago,
      estadoPago,
      montoPagado: estadoPago === 'Pagado' ? total : 0,
      precioUnitario: perfume.precioVenta,
      costoUnitario: perfume.precioCosto,
      total,
    };

    await this.ventaRepo.guardar(venta);

    if (estadoPago === 'Pendiente') {
      cliente.saldoDeudor = (cliente.saldoDeudor || 0) + total;
    }
    cliente.historialCompras.push(venta.id);
    await this.clienteRepo.guardar(cliente);

    return {
      venta,
      alertaReposicion: perfumeActualizado.stock <= 3,
      stockRestante: perfumeActualizado.stock,
    };
  }
}