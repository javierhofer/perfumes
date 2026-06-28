export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  historialCompras: string[];
  notasPersonales: string;
  saldoDeudor: number;
  activo: boolean;
  etiquetas: string[];
}