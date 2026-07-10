import makeWASocket, {
  makeCacheableSignalKeyStore,
  DisconnectReason,
  WASocket,
  proto,
  initAuthCreds,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import {
  WhatsappTransport,
  TransportStatus,
  TransportEvents,
  IncomingMessage,
} from './WhatsappTransport';
import {
  loadCreds,
  loadCredsOrReset,
  saveCreds,
  phoneDir,
} from '../session/store';

const AUTH_DIR = (phoneId: string) => phoneDir(phoneId);

export class BaileysTransport implements WhatsappTransport {
  readonly phoneId: string;
  public status: TransportStatus = 'close';
  private sock: WASocket | null = null;
  private events: TransportEvents = {};
  private currentQR: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private intentionalClose = false;
  private reconnectAttempts = 0;

  constructor(phoneId: string) {
    this.phoneId = phoneId;
  }

  getCurrentQR(): string | null {
    return this.currentQR;
  }

  async connect(events: TransportEvents): Promise<void> {
    this.events = events;
    this.intentionalClose = false;
    await this.openSocket();
  }

  async disconnect(): Promise<void> {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch {
        try { this.sock.end(undefined); } catch { /* ignore */ }
      }
      this.sock = null;
    }
    this.status = 'close';
  }

  isHealthy(): boolean {
    return this.status === 'open';
  }

  private async openSocket(): Promise<void> {
    const dir = AUTH_DIR(this.phoneId);
    const creds = loadCredsOrReset<ReturnType<typeof initAuthCreds>>(this.phoneId);

    const { state, saveCreds: baileySaveCreds } = await makeWASocketState(dir, creds ?? undefined);

    this.sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, { trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {} } as any),
      },
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: true,
    });

    this.sock.ev.on('creds.update', () => {
      baileySaveCreds();
      saveCreds(this.phoneId, this.sock!.authState.creds);
    });

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.currentQR = qr;
        this.status = 'connecting';
        console.log(`[Baileys:${this.phoneId}] QR generado, esperando escaneo.`);
        this.events.onQR?.(qr);
        return;
      }

      if (connection === 'open') {
        this.currentQR = null;
        this.status = 'open';
        this.reconnectAttempts = 0;
        console.log(`[Baileys:${this.phoneId}] Conectado.`);
        this.events.onStatus?.('open');
        return;
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const reason = lastDisconnect?.error?.message ?? 'unknown';

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          this.status = 'logged_out';
          console.warn(`[Baileys:${this.phoneId}] Sesion cerrada por logout (${reason}). QR requerido.`);
          this.events.onStatus?.('logged_out', { reason });
          return;
        }

        if (statusCode === DisconnectReason.forbidden || statusCode === 403) {
          this.status = 'banned';
          console.error(`[Baileys:${this.phoneId}] NUMERO BANEADO (${reason}).`);
          this.events.onStatus?.('banned', { reason });
          return;
        }

        this.status = 'close';
        this.events.onStatus?.('close', { reason, statusCode });

        if (!this.intentionalClose) {
          this.reconnectAttempts++;
          const delay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
          console.log(
            `[Baileys:${this.phoneId}] Desconectado (${reason}), reintento #${this.reconnectAttempts} en ${Math.round(delay / 1000)}s...`
          );
          this.scheduleReconnect(delay);
        }
      }
    });

    this.sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        const incoming = this.parseIncoming(msg);
        if (incoming) this.events.onMessage?.(incoming);
      }
    });
  }

  private scheduleReconnect(delayMs = 5000): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalClose) {
        this.openSocket().catch((e) => {
          console.error(`[Baileys:${this.phoneId}] reconnect fallo:`, e);
          this.events.onError?.(e);
          this.scheduleReconnect(5000);
        });
      }
    }, delayMs);
  }

  private parseIncoming(msg: proto.IWebMessageInfo): IncomingMessage | null {
    if (!msg.message || !msg.key) return null;
    const text = extractText(msg.message);
    if (!text) return null;

    const fromJid = msg.key.remoteJid ?? '';
    const fromNumber = jidToNumber(fromJid);
    if (!fromNumber) return null;

    return {
      phoneId: this.phoneId,
      fromJid,
      fromNumber,
      text,
      messageId: msg.key.id ?? '',
      timestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) : Date.now(),
      pushName: msg.pushName ?? undefined,
    };
  }

  async sendText(to: string, text: string): Promise<void> {
    if (!this.sock || this.status !== 'open') {
      throw new Error(`[Baileys:${this.phoneId}] No estoy conectado.`);
    }
    const jid = numberToJid(to);
    await this.sock.sendMessage(jid, { text });
    console.log(`[Baileys:${this.phoneId}] -> ${to} (${text.length} chars)`);
  }
}

const extractText = (msg: proto.IMessage): string | null => {
  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
  return null;
};

const jidToNumber = (jid: string): string | null => {
  const sep = jid.indexOf('@');
  if (sep < 0) return null;
  const raw = jid.substring(0, sep);
  if (raw.includes(':')) return raw.split(':')[0];
  return raw;
};

const numberToJid = (to: string): string => {
  const clean = to.replace(/[^\d]/g, '');
  return `${clean}@s.whatsapp.net`;
};

const makeWASocketState = async (
  _dir: string,
  creds?: ReturnType<typeof initAuthCreds>
): Promise<{
  state: { creds: ReturnType<typeof initAuthCreds>; keys: any };
  saveCreds: () => void;
}> => {
  const { state, saveCreds } = await import('@whiskeysockets/baileys').then((b) =>
    b.useMultiFileAuthState(_dir)
  );
  if (creds) state.creds = creds;
  return { state, saveCreds };
};