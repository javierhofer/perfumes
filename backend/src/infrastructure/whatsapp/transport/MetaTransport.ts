import axios, { AxiosInstance } from 'axios';
import {
  WhatsappTransport,
  TransportStatus,
  TransportEvents,
} from './WhatsappTransport';

const GRAPH_API_VERSION = 'v20.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class MetaTransport implements WhatsappTransport {
  readonly phoneId: string;
  private token: string;
  private client: AxiosInstance;
  public status: TransportStatus = 'open';

  constructor(phoneId: string, token: string) {
    this.phoneId = phoneId;
    this.token = token;
    this.client = axios.create({
      baseURL: GRAPH_BASE_URL,
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async connect(_events: TransportEvents): Promise<void> {
    if (!this.phoneId || !this.token) {
      throw new Error(
        '[MetaTransport] Faltan WA_PHONE_ID o WA_TOKEN. Configuralas antes de usar el webhook.'
      );
    }
    this.status = 'open';
  }

  async disconnect(): Promise<void> {
    this.status = 'close';
  }

  isHealthy(): boolean {
    return this.status === 'open';
  }

  async sendText(to: string, text: string): Promise<void> {
    await this.sendWithRetry(`/${this.phoneId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    });
    console.log(`[MetaTransport] Mensaje enviado a ${to} (${text.length} chars)`);
  }

  private async sendWithRetry(url: string, payload: unknown): Promise<void> {
    try {
      await this.client.post(url, payload);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        console.error(
          `[MetaTransport] Meta devolvio ${err.response.status}:`,
          JSON.stringify(err.response.data)
        );
      } else {
        console.error('[MetaTransport] Error de red al enviar mensaje:', err);
      }
      console.log('[MetaTransport] Reintentando en 1s...');
      await new Promise((r) => setTimeout(r, 1000));
      await this.client.post(url, payload);
    }
  }
}