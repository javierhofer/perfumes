export interface PerfumeDTO {
  id: string;
  marca: string;
  fragancia: string;
  tipo: string;
  mililitros: number;
  stock: number;
  precioCosto: number;
  precioVenta: number;
  margen: number;
  alertaCritica: boolean;
}