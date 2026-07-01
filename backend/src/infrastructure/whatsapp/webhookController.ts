import { Router, Request, Response, raw } from 'express';
import * as crypto from 'crypto';
import { parseCommand } from './commandParser';

// Webhook controller: handshake + receptor de mensajes
import {
  handleVentas,
  handleAyuda,
  handleComandoInvalido,
  handleDefault,
} from './commandHandlers';
import { sendTextMessage } from './whatsappClient';

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

const verifyToken = (): string => {
  const t = process.env.WA_VERIFY_TOKEN;
  if (!t) {
    throw new Error('[whatsapp] Falta variable de entorno WA_VERIFY_TOKEN');
  }
  return t;
};

const loadAllowedNumbers = (): Set<string> => {
  const raw = process.env.WA_ALLOWED_NUMBERS ?? '';
  if (!raw.trim()) {
    console.warn(
      '[whatsapp] WA_ALLOWED_NUMBERS no esta seteado. Todos los mensajes entrantes seran rechazados.'
    );
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
    console.warn(
      '[whatsapp] WA_APP_SECRET no seteado. Validacion de firma deshabilitada (NO recomendado en produccion).'
    );
    return true;
  }

  if (!signature) {
    console.warn('[whatsapp] Peticion sin x-hub-signature-256 en modo produccion. Rechazando.');
    return false;
  }

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
};

const respond = async (from: string, text: string): Promise<void> => {
  try {
    await sendTextMessage(from, text);
  } catch (err) {
    console.error(`[whatsapp] No pude responder a ${from}:`, err);
  }
};

const processPayload = async (
  payload: WhatsappWebhookPayload,
  allowed: Set<string>
): Promise<void> => {
  if (payload.object !== 'whatsapp_business_account' || !payload.entry) return;

  const expectedPhoneId = process.env.WA_PHONE_ID;
  if (!expectedPhoneId) {
    console.warn('[whatsapp] WA_PHONE_ID no seteado, ignorando payload.');
    return;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      const messages = value.messages ?? [];
      const incomingPhoneId = value.metadata?.phone_number_id;

      if (incomingPhoneId && incomingPhoneId !== expectedPhoneId) {
        console.warn(
          `[whatsapp] AVISO: mensaje dirigido a phone_id=${incomingPhoneId}, esperado=${expectedPhoneId}. WA_PHONE_ID en Render podria estar mal configurado.`
        );
      }

      for (const msg of messages) {
        if (msg.type !== 'text' || !msg.text) continue;

        const from = msg.from;
        if (!allowed.has(from)) {
          console.warn(
            `[whatsapp] Mensaje rechazado. from=${from} no esta en WA_ALLOWED_NUMBERS`
          );
          continue;
        }

        const text = msg.text.body;
        console.log(`[whatsapp] Mensaje recibido de ${from}: "${text}"`);

        const parsed = parseCommand(text);
        let response: string;

        if (!parsed) {
          response = await handleDefault();
        } else if (parsed.cmd === 'ventas') {
          response = await handleVentas(parsed.args!);
        } else if (parsed.cmd === 'ayuda') {
          response = await handleAyuda();
        } else {
          response = await handleComandoInvalido();
        }

        await respond(from, response);
      }
    }
  }
};

export const buildWhatsappRouter = (): Router => {
  const router = Router();

  router.get('/webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      if (mode === 'subscribe' && token === verifyToken()) {
        console.log('[whatsapp] Handshake OK con Meta');
        return res.status(200).send(challenge);
      }
      console.warn(
        `[whatsapp] Handshake rechazado. mode=${mode} tokenMatch=${token === verifyToken()}`
      );
      return res.sendStatus(403);
    } catch (err) {
      console.error('[whatsapp] Error en handshake:', err);
      return res.sendStatus(500);
    }
  });

  router.post(
    '/webhook',
    raw({ type: 'application/json', limit: '1mb' }),
    async (req: Request, res: Response) => {
      const rawBody = req.body as Buffer;
      const signature = req.header('x-hub-signature-256');

      console.log('[whatsapp] POST /webhook recibido, body bytes:', rawBody?.length ?? 0);

      if (!verifySignature(rawBody, signature)) {
        console.warn('[whatsapp] Firma invalida en POST /webhook');
        return res.sendStatus(401);
      }

      try {
        const payload = JSON.parse(rawBody.toString('utf8')) as WhatsappWebhookPayload;
        console.log('[whatsapp] Payload OK, procesando...');
        processPayload(payload, loadAllowedNumbers())
          .then(() => console.log('[whatsapp] processPayload termino OK'))
          .catch((e) => console.error('[whatsapp] processPayload error async:', e));
        res.sendStatus(200);
        return;
      } catch (err) {
        console.error('[whatsapp] Error parseando payload:', err);
        return res.sendStatus(200);
      }
    }
  );

  return router;
};
