import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../../../data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

export interface DatabaseShape {
  perfumes: any[];
  clientes: any[];
  ventas: any[];
  pagos: any[];
  configuracion?: any;
}

const ensureFile = (): void => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const inicial: DatabaseShape = { perfumes: [], clientes: [], ventas: [], pagos: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(inicial, null, 2), 'utf-8');
  }
};

export const cargarDB = (): DatabaseShape => {
  ensureFile();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const data = JSON.parse(raw) as DatabaseShape;
  return {
    perfumes: data.perfumes ?? [],
    clientes: data.clientes ?? [],
    ventas: data.ventas ?? [],
    pagos: data.pagos ?? [],
    configuracion: data.configuracion,
  };
};

export const guardarDB = (data: DatabaseShape): void => {
  ensureFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

export const DB_FILE_PATH = DB_PATH;