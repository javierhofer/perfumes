import type { Configuracion } from '../types/domain';
import { CONFIG_DEFAULT } from '../config/defaults';

let _config: Configuracion = CONFIG_DEFAULT;
export const setConfigGlobal = (c: Configuracion) => {
  _config = c;
};

export const formatearARS = (n: number): string => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: _config.moneda,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${_config.simboloMoneda}${n.toLocaleString('es-AR')}`;
  }
};

export const formatearFechaCorta = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
};

export const formatearFechaLarga = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const getMonedaSimbolo = (): string => _config.simboloMoneda;
export const getMonedaCodigo = (): string => _config.moneda;