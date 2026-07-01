import { ListarVentasUseCase, VentaListadaDTO } from '../../application/use-cases/ListarVentasUseCase';
import { JsonVentaRepository } from '../../infrastructure/persistence/JsonVentaRepository';
import { JsonClienteRepository } from '../../infrastructure/persistence/JsonClienteRepository';
import { JsonPerfumeRepository } from '../../infrastructure/persistence/JsonPerfumeRepository';
import { getDateRange, Ventana } from './commandParser';
import {
  formatVentasList,
  formatAyuda,
  formatComandoInvalido,
  formatError,
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

export const handleAyuda = async (): Promise<string> => formatAyuda();

export const handleComandoInvalido = async (): Promise<string> => formatComandoInvalido();

export const handleDefault = async (): Promise<string> =>
  `Comando no reconocido. Escribi *ayuda* para ver los comandos disponibles.`;
