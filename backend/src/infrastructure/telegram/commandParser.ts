export type Ventana =
  | { kind: 'dias'; dias: number }
  | { kind: 'hoy' }
  | { kind: 'mes' };

export type Lang = 'es' | 'en';

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
  lang: Lang;
}

const detectLang = (norm: string): Lang => {
  if (/\b(ayuda|comandos|hola|mes|hoy|esto|este|ultima|ultimo|ultimos|ultimas|mas|vendido|vendidos)\b/.test(norm)) {
    return 'es';
  }
  return 'en';
};

const parseVentasArgs = (raw: string): Ventana | null => {
  if (!raw) return { kind: 'dias', dias: 30 };

  const numMatch = raw.match(/^(\d+)\s*d(?:ias?|ays?)?$/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n > 0 && n <= 365) return { kind: 'dias', dias: n };
  }

  if (raw === 'hoy' || raw === 'today') return { kind: 'hoy' };
  if (raw === 'mes' || raw === 'este mes' || raw === 'month' || raw === 'this month') return { kind: 'mes' };

  return null;
};

const TOP_MAX = 20;

const parseWindowToken = (raw: string): Ventana | null => {
  if (!raw) return { kind: 'dias', dias: 30 };

  const numMatch = raw.match(/^(\d+)\s*d(?:ias?|ays?)?$/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n > 0 && n <= 365) return { kind: 'dias', dias: n };
  }

  if (raw === 'hoy' || raw === 'today') return { kind: 'hoy' };
  if (raw === 'mes' || raw === 'este mes' || raw === 'month' || raw === 'this month') return { kind: 'mes' };

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

  const lang = detectLang(norm);

  if (norm === 'ayuda' || norm === 'help' || norm === 'comandos' || norm === 'commands') {
    return { cmd: 'ayuda', args: null, lang };
  }

  if (norm === 'ventas' || norm.startsWith('ventas ') || norm === 'sales' || norm.startsWith('sales ')) {
    const stem = norm.startsWith('ventas')
      ? norm.slice('ventas'.length).trim()
      : norm.slice('sales'.length).trim();
    const args = parseVentasArgs(stem);
    if (args === null) return null;
    return { cmd: 'ventas', args, lang };
  }

  if (
    norm === 'top' ||
    norm === 'mas vendido' ||
    norm === 'mas vendidos' ||
    norm.startsWith('top ') ||
    norm.startsWith('mas vendido ') ||
    norm.startsWith('mas vendidos ') ||
    norm === 'best' ||
    norm === 'bestsellers' ||
    norm === 'best sellers' ||
    norm.startsWith('best ')
  ) {
    let stem: string;
    if (norm.startsWith('top ')) stem = norm.slice('top'.length).trim();
    else if (norm.startsWith('mas vendido')) stem = norm.replace(/^mas vendidos?/, '').trim();
    else stem = norm.replace(/^best sellers?/, '').trim();
    const args = parseTopArgs(stem);
    if (args === null) return null;
    return { cmd: 'top', args, lang };
  }

  return null;
};

export const getDateRange = (
  ventana: Ventana,
  ref: Date = new Date(),
  lang: Lang = 'es'
): { desde: Date; hasta: Date; label: string } => {
  const hasta = new Date(ref);
  hasta.setHours(23, 59, 59, 999);

  const desde = new Date(ref);

  switch (ventana.kind) {
    case 'hoy':
      desde.setHours(0, 0, 0, 0);
      return { desde, hasta, label: lang === 'en' ? 'today' : 'hoy' };

    case 'mes': {
      desde.setDate(1);
      desde.setHours(0, 0, 0, 0);
      const locale = lang === 'en' ? 'en-US' : 'es-AR';
      const mes = desde.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      return { desde, hasta, label: lang === 'en' ? `month of ${mes}` : `mes de ${mes}` };
    }

    case 'dias': {
      desde.setDate(desde.getDate() - ventana.dias);
      desde.setHours(0, 0, 0, 0);
      return { desde, hasta, label: lang === 'en' ? `last ${ventana.dias} days` : `ultimos ${ventana.dias} dias` };
    }
  }
};