export type CsvCell = string | number | boolean | null | undefined;

const escapeCell = (valor: CsvCell): string => {
  if (valor === null || valor === undefined) return '';
  const str = String(valor);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const generarCSV = (filas: Record<string, CsvCell>[]): string => {
  if (filas.length === 0) return '';
  const headers = Object.keys(filas[0]);
  const lineas: string[] = [];
  lineas.push(headers.map(escapeCell).join(','));
  for (const fila of filas) {
    lineas.push(headers.map((h) => escapeCell(fila[h])).join(','));
  }
  return lineas.join('\r\n');
};

export const descargarCSV = (filename: string, contenido: string): void => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const sanitize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 40);

export const nombreArchivo = (prefijo: string, sufijo?: string, fecha?: Date): string => {
  const d = fecha ?? new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const fechaStr = `${yyyy}-${mm}-${dd}`;
  const partes = [prefijo];
  if (sufijo) partes.push(sanitize(sufijo));
  partes.push(fechaStr);
  return `${partes.join('-')}.csv`;
};