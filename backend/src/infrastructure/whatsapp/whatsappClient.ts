import axios, { AxiosInstance } from 'axios';

const GRAPH_API_VERSION = 'v20.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface WhatsAppConfig {
  phoneId: string;
  token: string;
}

const readConfig = (): WhatsAppConfig => {
  const phoneId = process.env.WA_PHONE_ID;
  const token = process.env.WA_TOKEN;

  if (!phoneId || !token) {
    throw new Error(
      '[whatsapp] Faltan variables de entorno WA_PHONE_ID o WA_TOKEN. Configuralas en Render antes de usar el webhook.'
    );
  }

  return { phoneId, token };
};

const createHttpClient = (token: string): AxiosInstance =>
  axios.create({
    baseURL: GRAPH_BASE_URL,
    timeout: 10_000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

const sendWithRetry = async (
  client: AxiosInstance,
  url: string,
  payload: unknown
): Promise<void> => {
  try {
    await client.post(url, payload);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      console.error(
        `[whatsapp] Meta devolvio ${err.response.status}:`,
        JSON.stringify(err.response.data)
      );
    } else {
      console.error('[whatsapp] Error de red al enviar mensaje:', err);
    }
    console.log('[whatsapp] Reintentando en 1s...');
    await new Promise((r) => setTimeout(r, 1000));
    await client.post(url, payload);
  }
};

export const sendTextMessage = async (to: string, text: string): Promise<void> => {
  const { phoneId, token } = readConfig();
  const client = createHttpClient(token);

  const url = `/${phoneId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  };

  await sendWithRetry(client, url, payload);
  console.log(`[whatsapp] Mensaje enviado a ${to} (${text.length} chars)`);
};
