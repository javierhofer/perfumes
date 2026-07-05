export type TransportStatus = 'connecting' | 'open' | 'close' | 'logged_out' | 'banned';

export interface IncomingMessage {
  phoneId: string;
  fromJid: string;
  fromNumber: string;
  text: string;
  messageId: string;
  timestamp: number;
  pushName?: string;
}

export interface OutboundMessage {
  to: string;
  text: string;
}

export interface TransportEvents {
  onMessage?: (msg: IncomingMessage) => void;
  onStatus?: (status: TransportStatus, info?: Record<string, unknown>) => void;
  onQR?: (qr: string) => void;
  onError?: (err: Error) => void;
}

export interface WhatsappTransport {
  readonly phoneId: string;
  readonly status: TransportStatus;
  connect(events: TransportEvents): Promise<void>;
  disconnect(): Promise<void>;
  sendText(to: string, text: string): Promise<void>;
  sendTextViaPhone?(to: string, text: string): Promise<void>;
  isHealthy(): boolean;
}