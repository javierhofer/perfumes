import { JsonConfiguracionRepository } from '../infrastructure/persistence/JsonConfiguracionRepository';

let cachedSimbolo: string | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

const repo = new JsonConfiguracionRepository();

export const obtenerSimboloMoneda = async (): Promise<string> => {
  const ahora = Date.now();
  if (cachedSimbolo !== null && ahora - cachedAt < TTL_MS) {
    return cachedSimbolo;
  }

  const cfg = await repo.obtener();
  cachedSimbolo = cfg.simboloMoneda || '$';
  cachedAt = ahora;
  return cachedSimbolo;
};

export const invalidarCacheMoneda = (): void => {
  cachedSimbolo = null;
  cachedAt = 0;
};
