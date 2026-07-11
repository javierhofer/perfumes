import { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import { IVentaRepository } from '../../domain/repositories/IVentaRepository';
import { IPerfumeRepository } from '../../domain/repositories/IPerfumeRepository';
import { IConfiguracionRepository } from '../../domain/repositories/IConfiguracionRepository';

export interface ClienteRecompraDTO {
  clienteId: string;
  nombre: string;
  telefono: string;
  perfumeNombre: string;
  ultimaCompraFecha: string;
  diasSinComprar: number;
  telegramUrl: string;
}

const reemplazarVars = (plantilla: string, vars: Record<string, string | number>): string => {
  let r = plantilla;
  for (const [k, v] of Object.entries(vars)) {
    r = r.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return r;
};

export class ObtenerClientesParaRecompraUseCase {
  constructor(
    private readonly clienteRepo: IClienteRepository,
    private readonly ventaRepo: IVentaRepository,
    private readonly perfumeRepo: IPerfumeRepository,
    private readonly configRepo: IConfiguracionRepository
  ) {}

  async execute(): Promise<ClienteRecompraDTO[]> {
    const [clientes, config] = await Promise.all([
      this.clienteRepo.listar(true),
      this.configRepo.obtener(),
    ]);
    const diasLimite = config.diasRecompra;
    const plantilla = config.plantillaTelegram;
    const ahora = new Date();
    const resultado: ClienteRecompraDTO[] = [];

    for (const cliente of clientes) {
      const ventas = await this.ventaRepo.obtenerPorCliente(cliente.id);
      if (ventas.length === 0) continue;

      const ultimaVenta = ventas.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )[0];

      const dias = Math.floor(
        (ahora.getTime() - new Date(ultimaVenta.fecha).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dias > diasLimite) {
        const perfume = await this.perfumeRepo.obtenerPorId(ultimaVenta.productoId);
        const perfumeNombre = perfume ? `${perfume.marca} ${perfume.fragancia}` : 'tu perfume';
        const telefonoLimpio = cliente.telefono.replace(/[^0-9]/g, '');
        const mensaje = encodeURIComponent(
          reemplazarVars(plantilla, {
            nombre: cliente.nombre,
            dias,
            perfume: perfumeNombre,
          })
        );
        const telegramUrl = `https://t.me/${telefonoLimpio}?text=${mensaje}`;

        resultado.push({
          clienteId: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          perfumeNombre,
          ultimaCompraFecha: ultimaVenta.fecha,
          diasSinComprar: dias,
          telegramUrl,
        });
      }
    }

    return resultado.sort((a, b) => b.diasSinComprar - a.diasSinComprar);
  }
}