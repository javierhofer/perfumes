import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ALGO = 'aes-256-gcm';

let cachedKey: Buffer | null = null;

const getKey = (): Buffer => {
  if (cachedKey) return cachedKey;
  const hex = process.env.WA_SESSION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      '[sessionStore] WA_SESSION_KEY debe ser un hex de 64 chars (32 bytes). Generala con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  cachedKey = Buffer.from(hex, 'hex');
  return cachedKey;
};

export const encryptJson = (data: unknown): Buffer => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
};

export const decryptJson = <T = unknown>(buf: Buffer): T => {
  if (buf.length < 28) throw new Error('[sessionStore] Buffer corrupto');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString('utf8')) as T;
};

export const authDir = (): string => {
  const dir = path.resolve(process.cwd(), 'data', 'auth');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

export const phoneDir = (phoneId: string): string => {
  const safe = phoneId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = path.join(authDir(), safe);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

export const credsPath = (phoneId: string): string => path.join(phoneDir(phoneId), 'creds.bin');

export const loadCreds = <T = unknown>(phoneId: string): T | null => {
  const p = credsPath(phoneId);
  if (!fs.existsSync(p)) return null;
  try {
    const buf = fs.readFileSync(p);
    return decryptJson<T>(buf);
  } catch (err) {
    console.warn(`[sessionStore] No pude leer creds de ${phoneId}, regenerando QR:`, err);
    return null;
  }
};

export const loadCredsOrReset = <T = unknown>(phoneId: string): T | null => {
  const p = credsPath(phoneId);
  if (!fs.existsSync(p)) return null;
  try {
    const buf = fs.readFileSync(p);
    return decryptJson<T>(buf);
  } catch (err) {
    console.warn(
      `[WHATSAPP-WARN] creds.bin de ${phoneId} corrupto o no se puede descifrar. Reseteando sesion para forzar QR limpio.`,
      err
    );
    try {
      fs.unlinkSync(p);
      console.warn(`[WHATSAPP-WARN] creds.bin eliminado. Reconectar el chip escaneando el QR nuevo.`);
    } catch (e2) {
      console.error(`[WHATSAPP-CRITICAL] No pude borrar creds.bin de ${phoneId}:`, e2);
    }
    return null;
  }
};

export const saveCreds = <T = unknown>(phoneId: string, data: T): void => {
  const enc = encryptJson(data);
  fs.writeFileSync(credsPath(phoneId), enc);
};

export const clearCreds = (phoneId: string): void => {
  const p = credsPath(phoneId);
  if (fs.existsSync(p)) fs.unlinkSync(p);
};

export const loadCreatedAt = (phoneId: string): number => {
  const p = path.join(phoneDir(phoneId), 'created-at');
  if (!fs.existsSync(p)) {
    const now = Date.now();
    fs.writeFileSync(p, String(now));
    return now;
  }
  return parseInt(fs.readFileSync(p, 'utf8'), 10);
};