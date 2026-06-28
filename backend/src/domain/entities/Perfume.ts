export type TipoPerfume = 'EDT' | 'EDP' | 'Parfum' | 'Colonia';

export interface Perfume {
  id: string;
  marca: string;
  fragancia: string;
  tipo: TipoPerfume;
  mililitros: number;
  stock: number;
  precioCosto: number;
  precioVenta: number;
}

export const margenGanancia = (p: Perfume): number => p.precioVenta - p.precioCosto;

export const alertaCritica = (p: Perfume): boolean => p.stock <= 3;