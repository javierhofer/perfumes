export type Ventana =
  | { kind: 'dias'; dias: number }
  | { kind: 'hoy' }
  | { kind: 'mes' };

const stripAccents = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalize = (s: string): string =>
  stripAccents(s).toLowerCase().trim().replace(/\s+/g, ' ');

export interface TopArgs {
  cantidad: number;
  ventana: Ventana;
}

export interface ParsedCommand {
  cmd: 'ventas' | 'ayuda' | 'top';
  args: Ventana | TopArgs | null;
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

const TOP_MAX = 20;

const parseWindowToken = (raw: string): Ventana | null => {
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

const parseCantidadToken = (raw: string): number | null => {
  if (!raw) return 5;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || n > TOP_MAX) return null;
  return n;
};

const parseTopArgs = (raw: string): TopArgs | null => {
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { cantidad: 5, ventana: { kind: 'dias', dias: 30 } };
  }
  if (tokens.length === 1) {
    const cant = parseCantidadToken(tokens[0]);
    if (cant === null) return null;
    return { cantidad: cant, ventana: { kind: 'dias', dias: 30 } };
  }
  const cant = parseCantidadToken(tokens[0]);
  if (cant === null) return null;
  const ventana = parseWindowToken(tokens.slice(1).join(' '));
  if (ventana === null) return null;
  return { cantidad: cant, ventana };
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

  if (
    norm === 'top' ||
    norm === 'mas vendido' ||
    norm === 'mas vendidos' ||
    norm.startsWith('top ') ||
    norm.startsWith('mas vendido ') ||
    norm.startsWith('mas vendidos ')
  ) {
    const stem = norm.startsWith('top')
      ? norm.slice('top'.length).trim()
      : norm.replace(/^mas vendidos?/, '').trim();
    const args = parseTopArgs(stem);
    if (args === null) return null;
    return { cmd: 'top', args };
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
