import { VentaListadaDTO } from '../../application/use-cases/ListarVentasUseCase';
import { obtenerSimboloMoneda } from '../../shared/monedaHelper';
import { Lang } from './commandParser';

const fmtDate = (iso: string, lang: Lang): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return lang === 'en' ? `${mm}/${dd}` : `${dd}/${mm}`;
};

const fmtMoney = (n: number, simbolo: string): string => {
  const rounded = Math.round(n);
  const locale = 'es-AR';
  return `${simbolo}${rounded.toLocaleString(locale)}`;
};

const estadoIcono = (estado: string, lang: Lang): string => {
  switch (estado) {
    case 'Pagado':
      return lang === 'en' ? 'OK' : 'OK';
    case 'Parcial':
      return lang === 'en' ? 'MED' : 'MED';
    case 'Pendiente':
      return lang === 'en' ? 'PND' : 'PTE';
    default:
      return '?';
  }
};

const estadoTraducido = (estado: string, lang: Lang): string => {
  if (lang === 'en') {
    if (estado === 'Pagado') return 'Paid';
    if (estado === 'Parcial') return 'Partial';
    if (estado === 'Pendiente') return 'Pending';
  }
  return estado;
};

export const formatVentasList = async (
  ventas: VentaListadaDTO[],
  labelPeriodo: string,
  lang: Lang = 'es'
): Promise<string> => {
  const simbolo = await obtenerSimboloMoneda();
  const total = ventas.reduce((acc, v) => acc + v.total, 0);
  const cobrado = ventas.reduce((acc, v) => acc + (v.montoPagado ?? 0), 0);
  const pendiente = total - cobrado;

  if (ventas.length === 0) {
    return [
      lang === 'en' ? `Sales (${labelPeriodo})` : `Ventas (${labelPeriodo})`,
      ``,
      lang === 'en' ? 'No sales recorded in that period.' : 'No se registran ventas en ese periodo.',
    ].join('\n');
  }

  const lines: string[] = [];
  const header = lang === 'en'
    ? `SALES (${labelPeriodo.toUpperCase()})`
    : `VENTAS (${labelPeriodo.toUpperCase()})`;
  const countLabel = lang === 'en'
    ? `${ventas.length} sales - Total ${fmtMoney(total, simbolo)}`
    : `${ventas.length} ventas - Total ${fmtMoney(total, simbolo)}`;
  lines.push(header);
  lines.push(countLabel);
  if (pendiente > 0) {
    const cobradoLabel = lang === 'en' ? 'Collected' : 'Cobrado';
    const pendienteLabel = lang === 'en' ? 'Pending' : 'Pendiente';
    lines.push(`${cobradoLabel}: ${fmtMoney(cobrado, simbolo)} | ${pendienteLabel}: ${fmtMoney(pendiente, simbolo)}`);
  } else {
    lines.push(`${lang === 'en' ? 'Collected' : 'Cobrado'}: ${fmtMoney(cobrado, simbolo)}`);
  }
  lines.push(``);

  const MAX_ITEMS = 30;
  const items = ventas.slice(0, MAX_ITEMS);
  items.forEach((v, idx) => {
    const n = `${idx + 1}.`;
    lines.push(`${n} ${v.clienteNombre}`);
    lines.push(
      `   ${v.productoNombre} x${v.cantidad} - ${fmtMoney(v.total, simbolo)}`
    );
    const estado = `${estadoIcono(v.estadoPago, lang)} ${estadoTraducido(v.estadoPago, lang)}`;
    const fecha = fmtDate(v.fecha, lang);
    lines.push(`   ${v.tipoPago} - ${estado} - ${fecha}`);
    lines.push(``);
  });

  if (ventas.length > MAX_ITEMS) {
    const more = ventas.length - MAX_ITEMS;
    lines.push(
      lang === 'en'
        ? `...and ${more} more sales.`
        : `...y ${more} ventas mas.`
    );
    lines.push(
      lang === 'en'
        ? `(Limit of ${MAX_ITEMS} to fit one message.)`
        : `(Limite de ${MAX_ITEMS} para que entre en un mensaje.)`
    );
  }

  return lines.join('\n');
};

export interface TopItem {
  productoNombre: string;
  unidades: number;
  total: number;
}

export const formatTopList = async (
  items: TopItem[],
  labelPeriodo: string,
  cantidadPedida: number,
  lang: Lang = 'es'
): Promise<string> => {
  const simbolo = await obtenerSimboloMoneda();
  const totalFacturado = items.reduce((acc, it) => acc + it.total, 0);

  if (items.length === 0) {
    const header = lang === 'en' ? `TOP ${cantidadPedida}` : `TOP ${cantidadPedida}`;
    return [
      `${header} (${labelPeriodo})`,
      ``,
      lang === 'en' ? 'No sales recorded in that period.' : 'No se registran ventas en ese periodo.',
    ].join('\n');
  }

  const lines: string[] = [];
  const header = lang === 'en'
    ? `TOP ${cantidadPedida} PERFUMES (${labelPeriodo.toUpperCase()})`
    : `TOP ${cantidadPedida} PERFUMES (${labelPeriodo.toUpperCase()})`;
  lines.push(header);
  lines.push(``);

  items.forEach((it, idx) => {
    const n = `${idx + 1}.`;
    const unidadesLabel = lang === 'en' ? `units` : `unidades`;
    lines.push(`${n} ${it.productoNombre}`);
    lines.push(
      lang === 'en'
        ? `   x${it.unidades} ${unidadesLabel} - ${fmtMoney(it.total, simbolo)}`
        : `   x${it.unidades} ${unidadesLabel} - ${fmtMoney(it.total, simbolo)}`
    );
  });

  lines.push(``);
  const totalLabel = lang === 'en' ? 'Total billed' : 'Total facturado';
  lines.push(`${totalLabel}: ${fmtMoney(totalFacturado, simbolo)}`);

  return lines.join('\n');
};

export const formatAyuda = (lang: Lang = 'es'): string => {
  if (lang === 'en') {
    return [
      `AVAILABLE COMMANDS`,
      ``,
      `sales - Sales of the last 30 days`,
      `sales 7d / 15d / 90d - Sales of the last N days`,
      `sales today - Sales of today`,
      `sales month - Sales of the current month`,
      `top / bestseller - Top 5 best-selling perfumes (last 30 days)`,
      `top N - Top N perfumes (eg: top 10)`,
      `top N 7d - Top N perfumes of the last 7 days`,
      `help - Shows this message`,
      ``,
      `Tip: messages are case-insensitive and accent-insensitive.`,
    ].join('\n');
  }
  return [
    `COMANDOS DISPONIBLES`,
    ``,
    `ventas - Ventas de los ultimos 30 dias`,
    `ventas 7d / 15d / 90d - Ventas de los ultimos N dias`,
    `ventas hoy - Ventas del dia de hoy`,
    `ventas mes - Ventas del mes en curso`,
    `sales 7d / today / month - Mismo en ingles`,
    `top / mas vendido - Top 5 perfumes mas vendidos (ultimos 30 dias)`,
    `top N - Top N perfumes (ej: top 10)`,
    `top N 7d - Top N perfumes de los ultimos 7 dias`,
    `ayuda / help - Muestra este mensaje`,
    ``,
    `Tip: los mensajes no distinguen tildes ni mayusculas.`,
  ].join('\n');
};

export const formatComandoInvalido = (lang: Lang = 'es'): string => {
  if (lang === 'en') {
    return [
      `I did not understand that command.`,
      ``,
      `Did you mean:`,
      `sales`,
      `sales 30d`,
      `sales today`,
      `sales month`,
      `help`,
    ].join('\n');
  }
  return [
    `No entendi ese comando.`,
    ``,
    `Probable typo. Probá:`,
    `ventas`,
    `ventas 30d`,
    `ventas hoy`,
    `ventas mes`,
    `ayuda`,
  ].join('\n');
};

export const formatError = (lang: Lang = 'es'): string =>
  lang === 'en'
    ? `Oops, something went wrong querying sales. Try again in a bit. If it persists, check backend logs.`
    : `Ups, algo salio mal al consultar las ventas. Reintentá en un rato. Si persiste, revisá los logs del backend.`;
