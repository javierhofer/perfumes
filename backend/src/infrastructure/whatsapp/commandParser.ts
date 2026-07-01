export type Ventana =
  | { kind: 'dias'; dias: number }
  | { kind: 'hoy' }
  | { kind: 'mes' };

const stripAccents = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalize = (s: string): string =>
  stripAccents(s).toLowerCase().trim().replace(/\s+/g, ' ');

export interface ParsedCommand {
  cmd: 'ventas' | 'ayuda';
  args: Ventana | null;
}

const parseVentasArgs = (raw: string): Ventana | null => {
  if (!raw) return { kind: 'dias', dias: 30 };

  const numMatch = raw.match(/^(\d+)\s*d(?:ias?)?$/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n > 0 && n <= 365) return { kind: 'dias', dias: n };
  }

  if (raw === 'hoy') return { kind: 'hoy' };
  if (raw === 'mes' || raw === 'este mes') return { kind: 'mes' };

  return null;
};

export const parseCommand = (text: string): ParsedCommand | null => {
  const norm = normalize(text);
  if (!norm) return null;

  if (norm === 'ayuda' || norm === 'help' || norm === 'comandos') {
    return { cmd: 'ayuda', args: null };
  }

  if (norm === 'ventas' || norm.startsWith('ventas ')) {
    const args = parseVentasArgs(norm.slice('ventas'.length).trim());
    if (args === null) return null;
    return { cmd: 'ventas', args };
  }

  return null;
};

export const getDateRange = (ventana: Ventana, ref: Date = new Date()): { desde: Date; hasta: Date; label: string } => {
  const hasta = new Date(ref);
  hasta.setHours(23, 59, 59, 999);

  const desde = new Date(ref);

  switch (ventana.kind) {
    case 'hoy':
      desde.setHours(0, 0, 0, 0);
      return { desde, hasta, label: 'hoy' };

    case 'mes': {
      desde.setDate(1);
      desde.setHours(0, 0, 0, 0);
      const mes = desde.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      return { desde, hasta, label: `mes de ${mes}` };
    }

    case 'dias': {
      desde.setDate(desde.getDate() - ventana.dias);
      desde.setHours(0, 0, 0, 0);
      return { desde, hasta, label: `ultimos ${ventana.dias} dias` };
    }
  }
};
