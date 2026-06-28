import { useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '../api/client';
import { CONFIG_DEFAULT } from '../config/defaults';
import type { Configuracion } from '../types/domain';
import { ConfigContext } from './ConfigContext';
import { setConfigGlobal } from '../hooks/formato';
import { setDeudaCriticaConfig } from '../hooks/deudaCritica';

interface ProviderProps {
  children: ReactNode;
}

export const ConfigProvider = ({ children }: ProviderProps) => {
  const [config, setConfig] = useState<Configuracion>(CONFIG_DEFAULT);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const c = await api.getConfiguracion();
      setConfig(c);
      setConfigGlobal(c);
      setDeudaCriticaConfig(c);
    } catch {
      // silencioso: mantiene defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setConfigGlobal(config);
    setDeudaCriticaConfig(config);
  }, [config]);

  useEffect(() => {
    const root = document.documentElement;
    if (config.temaVisual === 'oscuro') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [config.temaVisual]);

  const update = useCallback(
    async (parcial: Partial<Configuracion>) => {
      const nuevo = await api.updateConfiguracion(parcial);
      setConfig(nuevo);
    },
    []
  );

  return (
    <ConfigContext.Provider value={{ config, loading, update, refresh: cargar }}>
      {children}
    </ConfigContext.Provider>
  );
};