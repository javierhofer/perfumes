import { EventEmitter } from 'events';
import {
  WhatsappTransport,
  TransportStatus,
  TransportEvents,
  IncomingMessage,
} from './transport/WhatsappTransport';
import { BaileysTransport } from './transport/BaileysTransport';
import { MetaTransport } from './transport/MetaTransport';
import { clearCreds, loadCreatedAt } from './session/store';
import { notifyAdmin } from '../notifications/emailService';

export type PhoneStatus = TransportStatus | 'warming_up' | 'degraded';

export interface PhoneEntry {
  id: string;
  jid: string;
  number: string;
  transport: WhatsappTransport;
  status: PhoneStatus;
  createdAt: number;
  lastInboundAt: number | null;
  inboundToday: number;
  errorReason?: string;
}

export interface PoolEvents {
  onMessage: (msg: IncomingMessage, phoneId: string) => void;
  onPhoneStatus: (phoneId: string, status: PhoneStatus, info?: Record<string, unknown>) => void;
}

export class PhonePool extends EventEmitter {
  private phones: Map<string, PhoneEntry> = new Map();
  private rrIndex = 0;
  private lastWarnAt = new Map<string, number>();

  constructor(private readonly events: PoolEvents) {
    super();
  }

  async initialize(): Promise<void> {
    const driver = (process.env.WA_TRANSPORT ?? 'baileys').toLowerCase();
    if (driver !== 'baileys') {
      console.log(`[phonePool] driver=${driver}, pool no inicializa (usa MetaTransport directo).`);
      return;
    }

    const env = process.env.WA_PHONES ?? '';
    if (!env.trim()) {
      console.warn('[phonePool] WA_PHONES vacio. Pool sin telefonos.');
      return;
    }

    for (const item of env.split(',').map((s) => s.trim()).filter(Boolean)) {
      const [id, jid] = item.split(':');
      if (!id || !jid) {
        console.warn(`[phonePool] Formato invalido en WA_PHONES: "${item}". Esperado id:jid.`);
        continue;
      }
      try {
        await this.addPhone(id, jid, 'baileys');
      } catch (err) {
        console.error(`[phonePool] No pude arrancar ${id}:`, err);
      }
    }
  }

  async addPhone(id: string, jid: string, driver: 'baileys' | 'meta' = 'baileys'): Promise<PhoneEntry> {
    if (this.phones.has(id)) throw new Error(`[phonePool] Telefono ${id} ya existe.`);

    const number = jid.replace(/[^\d]/g, '');
    const transport = driver === 'meta'
      ? new MetaTransport(process.env.WA_PHONE_ID ?? '', process.env.WA_TOKEN ?? '')
      : new BaileysTransport(id);

    const createdAt = driver === 'baileys' ? loadCreatedAt(id) : Date.now();
    const warmupMs = (Number(process.env.WA_WARMUP_DAYS ?? 14) || 14) * 24 * 60 * 60 * 1000;
    const isWarming = driver === 'baileys' && Date.now() - createdAt < warmupMs;

    const entry: PhoneEntry = {
      id,
      jid,
      number,
      transport,
      status: isWarming ? 'warming_up' : transport.status,
      createdAt,
      lastInboundAt: null,
      inboundToday: 0,
    };
    this.phones.set(id, entry);

    const wrappedEvents: TransportEvents = {
      onMessage: (msg) => {
        entry.lastInboundAt = Date.now();
        entry.inboundToday += 1;
        this.events.onMessage(msg, id);
      },
      onStatus: (status, info) => {
        const previous = entry.status;
        entry.status = status;
        entry.errorReason = info?.['reason'] as string | undefined;
        console.log(`[phonePool] ${id} -> ${status}${info?.['reason'] ? ' (' + info['reason'] + ')' : ''}`);
        this.events.onPhoneStatus(id, status, info);

        if (status === 'close' && info?.['reason'] === 'QR refs attempts ended') {
          console.warn(
            `[WHATSAPP-WARN] ${id}: el handshake de QR no llego a tiempo desde Render. Pista: si Render free estaba dormido, esperá 30s despues del deploy antes de re-escanear, o proba 2-3 veces consecutivas.`
          );
        }

        if (status === 'banned' && previous !== 'banned') {
          notifyAdmin(
            `[Perfumes Bot] Chip ${id} BANEADO`,
            [
              `Tu chip ${id} (${entry.number}) fue baneado por WhatsApp.`,
              ``,
              `El bot esta respondiendo con el canal de respaldo configurado.`,
              `Para reemplazarlo:`,
              `1. Consigue un nuevo chip con numero propio.`,
              `2. Edita backend/.env WA_PHONES reemplazando el numero antiguo.`,
              `3. Reinicia el backend.`,
              `4. Escanea el QR en GET /webhook/qr/${id}`,
              ``,
              `Detalle: ${info?.['reason'] ?? 'sin detalle'}`,
            ].join('\n')
          ).catch((e) => console.error('[phonePool] fallo email baneo:', e));
        } else if (status === 'logged_out' && previous !== 'logged_out') {
          notifyAdmin(
            `[Perfumes Bot] Chip ${id} cerro sesion`,
            [
              `El chip ${id} (${entry.number}) cerro sesion.`,
              `Necesita volver a escanear el QR.`,
              `Visitar: GET /webhook/qr/${id}`,
              ``,
              `Detalle: ${info?.['reason'] ?? 'sin detalle'}`,
            ].join('\n')
          ).catch((e) => console.error('[phonePool] fallo email logout:', e));
        } else if (status === 'close' && previous === 'open') {
          notifyAdmin(
            `[Perfumes Bot] Chip ${id} se desconecto`,
            [
              `El chip ${id} (${entry.number}) se desconecto.`,
              `El bot intentara reconectar automaticamente.`,
              `Si no vuelve en 10 minutos, revisar conectividad del dispositivo.`,
            ].join('\n')
          ).catch((e) => console.error('[phonePool] fallo email close:', e));
        } else if (status === 'open' && (previous === 'close' || previous === 'logged_out')) {
          notifyAdmin(
            `[Perfumes Bot] Chip ${id} se reconecto`,
            `El chip ${id} (${entry.number}) volvio a estar operativo.`
          ).catch((e) => console.error('[phonePool] fallo email recovery:', e));
        }
      },
      onQR: (qr) => {
        console.log(`[phonePool] ${id} QR pendiente. Visitar GET /webhook/qr/${id}`);
      },
      onError: (err) => {
        console.error(`[phonePool] ${id} error:`, err);
      },
    };

    await transport.connect(wrappedEvents);
    if (!isWarming) {
      entry.status = transport.status;
    }
    console.log(`[phonePool] Telefono ${id} (${number}) registrado en estado ${entry.status}.`);
    return entry;
  }

  async removePhone(id: string): Promise<void> {
    const entry = this.phones.get(id);
    if (!entry) return;
    try {
      await entry.transport.disconnect();
    } catch (err) {
      console.warn(`[phonePool] disconnect de ${id} fallo:`, err);
    }
    this.phones.delete(id);
    clearCreds(id);
    console.log(`[phonePool] Telefono ${id} removido.`);
  }

  async replacePhone(id: string, newJid: string): Promise<{ entry: PhoneEntry; qr: string | null }> {
    const old = this.phones.get(id);
    if (old) await old.transport.disconnect();
    this.phones.delete(id);
    clearCreds(id);
    const entry = await this.addPhone(id, newJid, 'baileys');
    const qr = (entry.transport as BaileysTransport).getCurrentQR?.() ?? null;
    return { entry, qr };
  }

  getPhone(id: string): PhoneEntry | undefined {
    return this.phones.get(id);
  }

  listPhones(): PhoneEntry[] {
    return Array.from(this.phones.values()).map((p) => ({
      ...p,
      transport: p.transport,
    }));
  }

  selectHealthy(): PhoneEntry | null {
    const candidates = Array.from(this.phones.values()).filter(
      (p) => (p.status === 'open' || p.status === 'warming_up') && p.transport.isHealthy()
    );
    if (candidates.length === 0) return null;

    const now = Date.now();
    const throttledWarn = this.lastWarnAt.get('selectHealthy') ?? 0;
    if (now - throttledWarn > 60_000) {
      console.log(`[phonePool] Hay ${candidates.length}/${this.phones.size} telefonos sanos.`);
      this.lastWarnAt.set('selectHealthy', now);
    }

    this.rrIndex = (this.rrIndex + 1) % candidates.length;
    return candidates[this.rrIndex];
  }

  poolHealthy(): boolean {
    return this.selectHealthy() !== null;
  }

  anyAvailable(): boolean {
    return Array.from(this.phones.values()).some(
      (p) => p.status === 'open' || p.status === 'warming_up' || p.status === 'degraded'
    );
  }

  totalInbounds(): number {
    return Array.from(this.phones.values()).reduce((acc, p) => acc + p.inboundToday, 0);
  }
}

let poolInstance: PhonePool | null = null;

export const initPool = async (events: PoolEvents): Promise<PhonePool> => {
  if (poolInstance) return poolInstance;
  poolInstance = new PhonePool(events);
  await poolInstance.initialize();
  return poolInstance;
};

export const getPool = (): PhonePool => {
  if (!poolInstance) throw new Error('[phonePool] Pool no inicializado. Llamá initPool() primero.');
  return poolInstance;
};