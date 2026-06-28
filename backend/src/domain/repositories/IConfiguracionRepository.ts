import { Configuracion } from '../entities/Configuracion';

export interface IConfiguracionRepository {
  obtener(): Promise<Configuracion>;
  guardar(config: Configuracion): Promise<void>;
}