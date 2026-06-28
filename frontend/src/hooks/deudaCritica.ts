import type { Configuracion } from '../types/domain';
import { CONFIG_DEFAULT } from '../config/defaults';
import { formatearARS } from './formato';

let _config: Configuracion = CONFIG_DEFAULT;
export const setDeudaCriticaConfig = (c: Configuracion) => {
  _config = c;
};

export const esDeudaCritica = (saldoDeudor: number): boolean =>
  saldoDeudor >= _config.umbralDeudaCritica;

export const UMBRAL_DEUDA_CRITICA = CONFIG_DEFAULT.umbralDeudaCritica;

export const formatearUmbral = (): string => formatearARS(_config.umbralDeudaCritica);