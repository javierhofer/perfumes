import { IVentaRepository } from '../../domain/repositories/IVentaRepository';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';

export interface VentaListadaDTO {
  id: string;
  clienteNombre: string;
  productoNombre: string;
  cantidad: number;
  total: number;
  montoPagado: number;
  fecha: string;
  tipoPago: string;
  estadoPago: string;
}

export class ListarVentasUseCase {
  constructor(
    private readonly ventaRepo: IVentaRepository,
    private readonly clienteRepo: IClienteRepository,
    private readonly perfumeRepo: IPerfumeRepository
  ) {}

  async execute(): Promise<VentaListadaDTO[]> {
    const [ventas, clientes, perfumes] = await Promise.all([
      this.ventaRepo.listar(),
      this.clienteRepo.listar(true),
      this.perfumeRepo.listar(),
    ]);

    const clienteMap = new Map(clientes.map((c) => [c.id, c]));
    const perfumeMap = new Map(perfumes.map((p) => [p.id, p]));

    return ventas
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((v) => {
        const cli = clienteMap.get(v.clienteId);
        const per = perfumeMap.get(v.productoId);
        return {
          id: v.id,
          clienteNombre: cli?.nombre ?? 'N/D',
          productoNombre: per ? `${per.marca} ${per.fragancia}` : 'N/D',
          cantidad: v.cantidad,
          total: v.total,
          montoPagado: v.montoPagado ?? (v.estadoPago === 'Pagado' ? v.total : 0),
          fecha: v.fecha,
          tipoPago: v.tipoPago,
          estadoPago: v.estadoPago,
        };
      });
  }
}