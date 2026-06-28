import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';
import { IVentaRepository } from '../../domain/repositories/IVentaRepository';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository';

export interface DashboardMetricsDTO {
  ventasTotales: number;
  gananciaNeta: number;
  totalFraganciasEnStock: number;
  cuentasPorCobrar: number;
  ventasUltimos30Dias: { fecha: string; total: number }[];
}

export class ObtenerDashboardMetricsUseCase {
  constructor(
    private readonly perfumeRepo: IPerfumeRepository,
    private readonly ventaRepo: IVentaRepository,
    private readonly clienteRepo: IClienteRepository
  ) {}

  async execute(): Promise<DashboardMetricsDTO> {
    const [perfumes, ventas] = await Promise.all([
      this.perfumeRepo.listar(),
      this.ventaRepo.listar(),
    ]);

    const ventasTotales = ventas.reduce((acc, v) => acc + v.total, 0);
    const gananciaNeta = ventas.reduce(
      (acc, v) => acc + (v.precioUnitario - v.costoUnitario) * v.cantidad,
      0
    );
    const totalFraganciasEnStock = perfumes.reduce((acc, p) => acc + p.stock, 0);
    const cuentasPorCobrar = ventas
      .filter((v) => v.estadoPago !== 'Pagado')
      .reduce((acc, v) => acc + (v.total - (v.montoPagado ?? 0)), 0);

    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    const ventasRecientes = ventas.filter((v) => new Date(v.fecha) >= hace30);

    const agrupadas = new Map<string, number>();
    for (const v of ventasRecientes) {
      const dia = v.fecha.substring(0, 10);
      agrupadas.set(dia, (agrupadas.get(dia) || 0) + v.total);
    }
    const ventasUltimos30Dias = Array.from(agrupadas.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      ventasTotales,
      gananciaNeta,
      totalFraganciasEnStock,
      cuentasPorCobrar,
      ventasUltimos30Dias,
    };
  }
}