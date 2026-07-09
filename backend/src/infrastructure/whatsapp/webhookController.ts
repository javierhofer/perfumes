import { Router, Request, Response, raw } from 'express';
import * as crypto from 'crypto';
import { parseCommand, Lang } from './commandParser';
import {
  handleVentas,
  handleTop,
  handleAyuda,
  handleComandoInvalido,
  handleDefault,
} from './commandHandlers';
import { sendTextMessage, getTransport } from './whatsappClient';
import { PhonePool } from './phonePool';
import { BaileysTransport } from './transport/BaileysTransport';
import { cargarDB } from '../persistence/jsonStore';
import { IdiomaBot, CONFIG_DEFAULT } from '../../domain/entities/Configuracion';

export interface WhatsappMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsappValue {
  messaging_product: string;
  metadata: { phone_number_id: string; display_phone_number: string };
  contacts?: { profile: { name: string }; wa_id: string }[];
  messages?: WhatsappMessage[];
  statuses?: unknown[];
}

interface WhatsappChange {
  value: WhatsappValue;
  field: string;
}

interface WhatsappEntry {
  id: string;
  changes: WhatsappChange[];
}

interface WhatsappWebhookPayload {
  object: string;
  entry: WhatsappEntry[];
}

const loadAllowedNumbers = (): Set<string> => {
  const raw = process.env.WA_ALLOWED_NUMBERS ?? '';
  if (!raw.trim()) {
    console.warn('[whatsapp] WA_ALLOWED_NUMBERS no seteado. Todos los mensajes seran rechazados.');
    return new Set();
  }
  const nums = raw
    .split(',')
    .map((s) => s.trim().replace(/^\+/, '').replace(/\s+/g, ''))
    .filter(Boolean);
  return new Set(nums);
};

const verifySignature = (rawBody: Buffer, signature: string | undefined): boolean => {
  const appSecret = process.env.WA_APP_SECRET;
  if (!appSecret) {
    console.warn('[whatsapp] WA_APP_SECRET no seteado. Validacion de firma deshabilitada.');
    return true;
  }
  if (!signature) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
};

const resolveLang = (detected: Lang): Lang => {
  try {
    const db = cargarDB();
    const cfg = (db.configuracion ?? {}) as Partial<{ idiomaBot: IdiomaBot }>;
    const override = (cfg.idiomaBot ?? CONFIG_DEFAULT.idiomaBot) as IdiomaBot;
    if (override === 'es' || override === 'en') return override;
  } catch {
    /* si el store no esta listo, caemos a autodeteccion */
  }
  return detected;
};

const handleIncoming = async (text: string): Promise<string> => {
  const parsed = parseCommand(text);
  if (!parsed) {
    const lang = resolveLang('es');
    return await handleComandoInvalido(lang);
  }
  const lang = resolveLang(parsed.lang);
  if (parsed.cmd === 'ventas') return await handleVentas(parsed.args as Parameters<typeof handleVentas>[0], lang);
  if (parsed.cmd === 'top') return await handleTop(parsed.args as Parameters<typeof handleTop>[0], lang);
  if (parsed.cmd === 'ayuda') return await handleAyuda(lang);
  return await handleDefault(lang);
};

export const ingestMetaMessage = async (
  payload: WhatsappWebhookPayload
): Promise<void> => {
  if (payload.object !== 'whatsapp_business_account' || !payload.entry) return;

  const expectedPhoneId = process.env.WA_PHONE_ID;
  if (!expectedPhoneId) {
    console.warn('[whatsapp] WA_PHONE_ID no seteado, ignorando payload.');
    return;
  }

  const allowed = loadAllowedNumbers();

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      const messages = value.messages ?? [];
      const incomingPhoneId = value.metadata?.phone_number_id;

      if (incomingPhoneId && incomingPhoneId !== expectedPhoneId) {
        console.warn(
          `[whatsapp] AVISO: mensaje dirigido a phone_id=${incomingPhoneId}, esperado=${expectedPhoneId}.`
        );
      }

      for (const msg of messages) {
        if (msg.type !== 'text' || !msg.text) continue;
        const from = msg.from;
        if (!allowed.has(from)) {
          console.warn(`[whatsapp] Mensaje rechazado. from=${from} no esta en WA_ALLOWED_NUMBERS.`);
          continue;
        }

        const text = msg.text.body;
        console.log(`[whatsapp] Mensaje recibido de ${from}: "${text}"`);

        try {
          const response = await handleIncoming(text);
          await sendTextMessage(from, response);
        } catch (err) {
          console.error(`[whatsapp] Error respondiendo a ${from}:`, err);
        }
      }
    }
  }
};

export const buildWhatsappRouter = (pool: PhonePool | null): Router => {
  const router = Router();
  const transport = (process.env.WA_TRANSPORT ?? 'meta').toLowerCase();

  router.get('/webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WA_VERIFY_TOKEN;

    if (mode === 'subscribe' && challenge && verifyToken && token === verifyToken) {
      console.log('[whatsapp] Handshake OK con Meta');
      return res.status(200).send(challenge);
    }

    return res.json({
      transport,
      active: getTransport() !== null,
      poolHealthy: pool ? pool.poolHealthy() : true,
    });
  });

  if (transport === 'baileys' && pool) {
    const QRCode = require('qrcode') as typeof import('qrcode');

    router.get('/webhook/qr/:phoneId', async (req: Request, res: Response) => {
      const phoneId = req.params['phoneId'];
      const phone = pool.getPhone(phoneId ?? '');
      if (!phone) return res.status(404).json({ error: 'phone_not_found' });
      const t = phone.transport as BaileysTransport;
      const qr = t.getCurrentQR?.();
      if (!qr) {
        return res.json({ ready: true, status: phone.status });
      }
      const png = await QRCode.toBuffer(qr, { type: 'png', width: 320 });
      res.setHeader('Content-Type', 'image/png');
      res.send(png);
    });

    router.get('/webhook/status', (_req: Request, res: Response) => {
      res.json({
        pool: pool.listPhones().map((p) => ({
          id: p.id,
          number: p.number,
          status: p.status,
        })),
        poolHealthy: pool.poolHealthy(),
      });
    });
  }

  router.post(
    '/webhook',
    raw({ type: 'application/json', limit: '1mb' }),
    async (req: Request, res: Response) => {
      const rawBody = req.body as Buffer;
      const signature = req.header('x-hub-signature-256');

      if (!verifySignature(rawBody, signature)) {
        console.warn('[whatsapp] Firma invalida en POST /webhook');
        return res.sendStatus(401);
      }

      try {
        const payload = JSON.parse(rawBody.toString('utf8')) as WhatsappWebhookPayload;
        ingestMetaMessage(payload)
          .then(() => console.log('[whatsapp] Payload procesado OK'))
          .catch((e) => console.error('[whatsapp] Error procesando payload:', e));
        return res.sendStatus(200);
      } catch (err) {
        console.error('[whatsapp] Error parseando payload:', err);
        return res.sendStatus(200);
      }
    }
  );

  return router;
};

export const buildInboundDispatcher = (_pool: PhonePool | null) => {
  return async (from: string, text: string): Promise<void> => {
    const allowed = loadAllowedNumbers();
    const normalized = from.replace(/[^\d]/g, '');
    if (!allowed.has(normalized)) {
      console.warn(`[whatsapp] Mensaje rechazado de ${from}.`);
      return;
    }
    console.log(`[whatsapp] Mensaje recibido de ${normalized}: "${text}"`);
    try {
      const response = await handleIncoming(text);
      await sendTextMessage(normalized, response);
    } catch (err) {
      console.error(`[whatsapp] Error respondiendo a ${normalized}:`, err);
    }
  };
};