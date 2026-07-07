import { ListarVentasUseCase, VentaListadaDTO } from '../../application/use-cases/ListarVentasUseCase';
import { JsonVentaRepository } from '../../infrastructure/persistence/JsonVentaRepository';
import { JsonClienteRepository } from '../../infrastructure/persistence/JsonClienteRepository';
import { JsonPerfumeRepository } from '../../infrastructure/persistence/JsonPerfumeRepository';
import { getDateRange, Ventana, TopArgs } from './commandParser';
import {
  formatVentasList,
  formatAyuda,
  formatComandoInvalido,
  formatError,
  formatTopList,
  TopItem,
} from './templates';

const useCase = new ListarVentasUseCase(
  new JsonVentaRepository(),
  new JsonClienteRepository(),
  new JsonPerfumeRepository()
);

const filtrarPorRango = (ventas: VentaListadaDTO[], desde: Date, hasta: Date): VentaListadaDTO[] => {
  const desdeIso = desde.toISOString();
  const hastaIso = hasta.toISOString();
  return ventas.filter((v) => v.fecha >= desdeIso && v.fecha <= hastaIso);
};

export const handleVentas = async (ventana: Ventana): Promise<string> => {
  try {
    const { desde, hasta, label } = getDateRange(ventana);
    const todas = await useCase.execute();
    const filtradas = filtrarPorRango(todas, desde, hasta);
    return await formatVentasList(filtradas, label);
  } catch (err) {
    console.error('[whatsapp] handleVentas fallo:', err);
    return formatError();
  }
};

export const handleTop = async (args: TopArgs): Promise<string> => {
  try {
    const { desde, hasta, label } = getDateRange(args.ventana);
    const todas = await useCase.execute();
    const filtradas = filtrarPorRango(todas, desde, hasta);

    const acumulado = new Map<string, TopItem>();
    for (const v of filtradas) {
      const key = v.productoNombre;
      const previo = acumulado.get(key);
      if (previo) {
        previo.unidades += v.cantidad;
        previo.total += v.total;
      } else {
        acumulado.set(key, {
          productoNombre: v.productoNombre,
          unidades: v.cantidad,
          total: v.total,
        });
      }
    }

    const ranking = Array.from(acumulado.values())
      .sort((a, b) => b.unidades - a.unidades || b.total - a.total)
      .slice(0, args.cantidad);

    return await formatTopList(ranking, label, args.cantidad);
  } catch (err) {
    console.error('[whatsapp] handleTop fallo:', err);
    return formatError();
  }
};

export const handleAyuda = async (): Promise<string> => formatAyuda();

export const handleComandoInvalido = async (): Promise<string> => formatComandoInvalido();

export const handleDefault = async (): Promise<string> =>
  `Comando no reconocido. Escribi *ayuda* para ver los comandos disponibles.`;
