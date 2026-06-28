import { createContext, useContext } from 'react';
import type { Configuracion } from '../types/domain';
import { CONFIG_DEFAULT } from '../config/defaults';

export interface ConfigContextValue {
  config: Configuracion;
  loading: boolean;
  update: (parcial: Partial<Configuracion>) => Promise<void>;
  refresh: () => Promise<void>;
}

export const ConfigContext = createContext<ConfigContextValue>({
  config: CONFIG_DEFAULT,
  loading: true,
  update: async () => {},
  refresh: async () => {},
});

export const useConfig = (): ConfigContextValue => useContext(ConfigContext);