import { VentaListadaDTO } from '../../application/use-cases/ListarVentasUseCase';
import { obtenerSimboloMoneda } from '../../shared/monedaHelper';

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

const fmtMoney = (n: number, simbolo: string): string => {
  const rounded = Math.round(n);
  return `${simbolo}${rounded.toLocaleString('es-AR')}`;
};

const estadoIcono = (estado: string): string => {
  switch (estado) {
    case 'Pagado':
      return 'OK';
    case 'Parcial':
      return 'MED';
    case 'Pendiente':
      return 'PTE';
    default:
      return '?';
  }
};

export const formatVentasList = async (
  ventas: VentaListadaDTO[],
  labelPeriodo: string
): Promise<string> => {
  const simbolo = await obtenerSimboloMoneda();
  const total = ventas.reduce((acc, v) => acc + v.total, 0);
  const cobrado = ventas.reduce((acc, v) => acc + (v.montoPagado ?? 0), 0);
  const pendiente = total - cobrado;

  if (ventas.length === 0) {
    return [
      `Ventas (${labelPeriodo})`,
      ``,
      `No se registran ventas en ese periodo.`,
    ].join('\n');
  }

  const lines: string[] = [];
  lines.push(`VENTAS (${labelPeriodo.toUpperCase()})`);
  lines.push(`${ventas.length} ventas - Total ${fmtMoney(total, simbolo)}`);
  if (pendiente > 0) {
    lines.push(`Cobrado: ${fmtMoney(cobrado, simbolo)} | Pendiente: ${fmtMoney(pendiente, simbolo)}`);
  } else {
    lines.push(`Cobrado: ${fmtMoney(cobrado, simbolo)}`);
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
    const estado = `${estadoIcono(v.estadoPago)} ${v.estadoPago}`;
    const fecha = fmtDate(v.fecha);
    lines.push(`   ${v.tipoPago} - ${estado} - ${fecha}`);
    lines.push(``);
  });

  if (ventas.length > MAX_ITEMS) {
    lines.push(`...y ${ventas.length - MAX_ITEMS} ventas mas.`);
    lines.push(`(Limite de ${MAX_ITEMS} para que entre en un mensaje.)`);
  }

  return lines.join('\n');
};

export const formatAyuda = (): string =>
  [
    `COMANDOS DISPONIBLES`,
    ``,
    `ventas - Ventas de los ultimos 30 dias`,
    `ventas 7d / 15d / 90d - Ventas de los ultimos N dias`,
    `ventas hoy - Ventas del dia de hoy`,
    `ventas mes - Ventas del mes en curso`,
    `ayuda - Muestra este mensaje`,
    ``,
    `Tip: los mensajes no distinguen tildes ni mayusculas.`,
  ].join('\n');

export const formatComandoInvalido = (): string =>
  [
    `No entendi ese comando.`,
    ``,
    `Probable typo. Probá:`,
    `ventas`,
    `ventas 30d`,
    `ventas hoy`,
    `ventas mes`,
    `ayuda`,
  ].join('\n');

export const formatError = (): string =>
  `Ups, algo salio mal al consultar las ventas. Reintentá en un rato. Si persiste, revisá los logs del backend.`;
