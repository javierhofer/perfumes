import { Configuracion, CONFIG_DEFAULT } from '../../domain/entities/Configuracion';
import { IConfiguracionRepository } from '../../domain/repositories/IConfiguracionRepository';
import { cargarDB, guardarDB } from './jsonStore';

export class JsonConfiguracionRepository implements IConfiguracionRepository {
  async obtener(): Promise<Configuracion> {
    const db = cargarDB();
    const stored = db.configuracion;
    if (!stored) return { ...CONFIG_DEFAULT };
    return {
      ...CONFIG_DEFAULT,
      ...stored,
      datosNegocio: { ...CONFIG_DEFAULT.datosNegocio, ...(stored.datosNegocio ?? {}) },
      numeracionTickets: { ...CONFIG_DEFAULT.numeracionTickets, ...(stored.numeracionTickets ?? {}) },
    };
  }

  async guardar(config: Configuracion): Promise<void> {
    const db = cargarDB();
    db.configuracion = config;
    guardarDB(db);
  }
}