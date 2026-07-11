import { ListarVentasUseCase, VentaListadaDTO } from '../../application/use-cases/ListarVentasUseCase';
import { JsonVentaRepository } from '../../infrastructure/persistence/JsonVentaRepository';
import { JsonClienteRepository } from '../../infrastructure/persistence/JsonClienteRepository';
import { JsonPerfumeRepository } from '../../infrastructure/persistence/JsonPerfumeRepository';
import { getDateRange, Ventana, TopArgs, Lang } from './commandParser';
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

export const handleVentas = async (ventana: Ventana, lang: Lang = 'es'): Promise<string> => {
  try {
    const { desde, hasta, label } = getDateRange(ventana, new Date(), lang);
    const todas = await useCase.execute();
    const filtradas = filtrarPorRango(todas, desde, hasta);
    return await formatVentasList(filtradas, label, lang);
  } catch (err) {
    console.error('[telegram] handleVentas fallo:', err);
    return formatError(lang);
  }
};

export const handleTop = async (args: TopArgs, lang: Lang = 'es'): Promise<string> => {
  try {
    const { desde, hasta, label } = getDateRange(args.ventana, new Date(), lang);
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

    return await formatTopList(ranking, label, args.cantidad, lang);
  } catch (err) {
    console.error('[telegram] handleTop fallo:', err);
    return formatError(lang);
  }
};

export const handleAyuda = async (lang: Lang = 'es'): Promise<string> => formatAyuda(lang);

export const handleComandoInvalido = async (lang: Lang = 'es'): Promise<string> => formatComandoInvalido(lang);

export const handleDefault = async (lang: Lang = 'es'): Promise<string> =>
  lang === 'en'
    ? `Command not recognized. Type *help* to see available commands.`
    : `Comando no reconocido. Escribi *ayuda* para ver los comandos disponibles.`;