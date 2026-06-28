import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { IVentaRepository } from '../../domain/repositories/IVentaRepository';
import { IPagoRepository } from '../../domain/repositories/IPagoRepository';
import { Pago } from '../../domain/entities/Pago';
import { randomUUID } from 'crypto';

export interface RegistrarPagoInput {
  clienteId: string;
  monto: number;
  nota?: string;
}

export interface RegistrarPagoOutput {
  pago: Pago;
  ventasActualizadas: { ventaId: string; montoAplicado: number; nuevoEstado: string }[];
  saldoRestante: number;
}

export class PagoInvalidoError extends Error {}
export class ClienteNoEncontradoError extends Error {}

export class RegistrarPagoClienteUseCase {
  constructor(
    private readonly clienteRepo: IClienteRepository,
    private readonly ventaRepo: IVentaRepository,
    private readonly pagoRepo: IPagoRepository
  ) {}

  async execute(input: RegistrarPagoInput): Promise<RegistrarPagoOutput> {
    if (!input.clienteId) throw new ClienteNoEncontradoError('clienteId requerido');
    if (input.monto <= 0) throw new PagoInvalidoError('El monto debe ser mayor a 0');

    const cliente = await this.clienteRepo.obtenerPorId(input.clienteId);
    if (!cliente) throw new ClienteNoEncontradoError(`Cliente ${input.clienteId} no existe`);

    const ventas = await this.ventaRepo.obtenerPorCliente(cliente.id);
    const pendientes = ventas
      .filter((v) => v.estadoPago !== 'Pagado')
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    let restante = input.monto;
    const ventasAfectadas: { ventaId: string; montoAplicado: number }[] = [];
    const ventasActualizadas: { ventaId: string; montoAplicado: number; nuevoEstado: string }[] = [];

    for (const v of pendientes) {
      if (restante <= 0) break;
      const montoPagadoPrevio = v.montoPagado ?? (v.estadoPago === 'Pagado' ? v.total : 0);
      const deudaVenta = v.total - montoPagadoPrevio;
      if (deudaVenta <= 0) continue;
      const aplicar = Math.min(restante, deudaVenta);
      const nuevoMontoPagado = montoPagadoPrevio + aplicar;
      const nuevoEstado = nuevoMontoPagado >= v.total ? 'Pagado' : 'Parcial';

      await this.ventaRepo.actualizar({
        ...v,
        montoPagado: nuevoMontoPagado,
        estadoPago: nuevoEstado,
      });

      ventasAfectadas.push({ ventaId: v.id, montoAplicado: aplicar });
      ventasActualizadas.push({ ventaId: v.id, montoAplicado: aplicar, nuevoEstado });
      restante = +(restante - aplicar).toFixed(2);
    }

    cliente.saldoDeudor = Math.max(0, +(cliente.saldoDeudor - input.monto).toFixed(2));
    await this.clienteRepo.actualizar(cliente);

    const pago: Pago = {
      id: randomUUID(),
      clienteId: cliente.id,
      monto: input.monto,
      fecha: new Date().toISOString(),
      nota: input.nota?.trim() || undefined,
      ventasAfectadas,
    };
    await this.pagoRepo.guardar(pago);

    return {
      pago,
      ventasActualizadas,
      saldoRestante: cliente.saldoDeudor,
    };
  }
}