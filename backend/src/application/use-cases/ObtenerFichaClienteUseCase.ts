import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { IVentaRepository } from '../../domain/repositories/IVentaRepository';
import { IPagoRepository } from '../../domain/repositories/IPagoRepository';
import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';

export interface FichaClienteDTO {
  cliente: {
    id: string;
    nombre: string;
    telefono: string;
    notasPersonales: string;
    saldoDeudor: number;
    activo: boolean;
    etiquetas: string[];
    cantidadCompras: number;
    totalGastado: number;
    primeraCompra: string | null;
    ultimaCompra: string | null;
  };
  ventas: {
    id: string;
    fecha: string;
    productoNombre: string;
    cantidad: number;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
    tipoPago: string;
    estadoPago: string;
  }[];
  pagos: {
    id: string;
    fecha: string;
    monto: number;
    nota?: string;
    ventasAfectadas: { ventaId: string; montoAplicado: number }[];
  }[];
  deudaTotal: number;
}

export class ObtenerFichaClienteUseCase {
  constructor(
    private readonly clienteRepo: IClienteRepository,
    private readonly ventaRepo: IVentaRepository,
    private readonly pagoRepo: IPagoRepository,
    private readonly perfumeRepo: IPerfumeRepository
  ) {}

  async execute(clienteId: string): Promise<FichaClienteDTO> {
    const cliente = await this.clienteRepo.obtenerPorId(clienteId);
    if (!cliente) throw new Error(`Cliente ${clienteId} no existe`);

    const [ventas, pagos, perfumes] = await Promise.all([
      this.ventaRepo.obtenerPorCliente(clienteId),
      this.pagoRepo.listarPorCliente(clienteId),
      this.perfumeRepo.listar(),
    ]);

    const perfumeMap = new Map(perfumes.map((p) => [p.id, p]));
    const ventasOrdenadas = [...ventas].sort((a, b) => b.fecha.localeCompare(a.fecha));

    const ventasDTO = ventasOrdenadas.map((v) => {
      const per = perfumeMap.get(v.productoId);
      const montoPagado = v.montoPagado ?? (v.estadoPago === 'Pagado' ? v.total : 0);
      return {
        id: v.id,
        fecha: v.fecha,
        productoNombre: per ? `${per.marca} ${per.fragancia}` : 'N/D',
        cantidad: v.cantidad,
        total: v.total,
        montoPagado,
        saldoPendiente: Math.max(0, v.total - montoPagado),
        tipoPago: v.tipoPago,
        estadoPago: v.estadoPago,
      };
    });

    const pagosDTO = pagos
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((p) => ({
        id: p.id,
        fecha: p.fecha,
        monto: p.monto,
        nota: p.nota,
        ventasAfectadas: p.ventasAfectadas,
      }));

    const fechas = ventasOrdenadas.map((v) => v.fecha).sort();
    const totalGastado = ventas.reduce((acc, v) => acc + v.total, 0);

    return {
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        notasPersonales: cliente.notasPersonales,
        saldoDeudor: cliente.saldoDeudor,
        activo: cliente.activo,
        etiquetas: cliente.etiquetas ?? [],
        cantidadCompras: ventasOrdenadas.length,
        totalGastado,
        primeraCompra: fechas[0] ?? null,
        ultimaCompra: fechas[fechas.length - 1] ?? null,
      },
      ventas: ventasDTO,
      pagos: pagosDTO,
      deudaTotal: cliente.saldoDeudor,
    };
  }
}