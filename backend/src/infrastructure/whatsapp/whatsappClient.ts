import { MetaTransport } from './transport/MetaTransport';
import { PhonePool } from './phonePool';

let metaTransport: MetaTransport | null = null;
let poolRef: PhonePool | null = null;

export const bindMeta = (transport: MetaTransport): void => {
  metaTransport = transport;
};

export const bindPool = (pool: PhonePool): void => {
  poolRef = pool;
};

export const getTransport = (): { sendText: (to: string, text: string) => Promise<void> } | null => {
  const driver = (process.env.WA_TRANSPORT ?? 'meta').toLowerCase();
  if (driver === 'baileys') {
    if (!poolRef) return null;
    const phone = poolRef.selectHealthy();
    if (!phone) return null;
    return { sendText: (to, text) => phone.transport.sendText(to, text) };
  }
  return metaTransport;
};

export const sendTextMessage = async (to: string, text: string): Promise<void> => {
  const driver = (process.env.WA_TRANSPORT ?? 'meta').toLowerCase();
  if (driver === 'baileys') {
    if (!poolRef) throw new Error('[whatsappClient] Pool no bindeado.');
    const phone = poolRef.selectHealthy();
    if (!phone) throw new Error('[whatsappClient] No hay telefonos sanos.');
    await phone.transport.sendText(to, text);
    return;
  }
  if (!metaTransport) throw new Error('[whatsappClient] MetaTransport no bindeado.');
  await metaTransport.sendText(to, text);
};