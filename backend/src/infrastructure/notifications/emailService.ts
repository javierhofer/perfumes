import * as net from 'net';
import * as tls from 'tls';
import * as dns from 'dns';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
}

export const loadSmtpConfig = (): SmtpConfig | null => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.SMTP_TO;
  if (!host || !user || !pass || !to) return null;
  return { host, port, user, pass, to };
};

const resolveMx = (domain: string): Promise<string[]> =>
  new Promise((resolve) => {
    dns.resolveMx(domain, (err, addrs) => {
      if (err || addrs.length === 0) resolve([domain]);
      else resolve(addrs.sort((a, b) => a.priority - b.priority).map((m) => m.exchange));
    });
  });

export const sendEmail = async (
  subject: string,
  body: string,
  cfg: SmtpConfig = loadSmtpConfig()!
): Promise<{ ok: true } | { ok: false; error: string }> => {
  if (!cfg) return { ok: false, error: 'SMTP no configurado' };

  const domain = cfg.user.split('@')[1] ?? cfg.host;
  const mxHosts = await resolveMx(domain);
  const target = mxHosts[0];

  return new Promise((resolve) => {
    const socket = cfg.port === 465
      ? tls.connect({ host: target, port: 465, servername: target })
      : net.createConnection({ host: target, port: cfg.port });

    let buffer = '';
    let step: 'EHLO' | 'AUTH' | 'MAIL' | 'RCPT' | 'DATA' | 'QUIT' = 'EHLO';
    let authStep: 'PLAIN' | 'LOGIN_USER' | 'LOGIN_PASS' = 'PLAIN';
    const log = (msg: string) => console.log(`[smtp] ${msg}`);

    const send = (cmd: string) => {
      log(`>> ${cmd.split('\n')[0].slice(0, 60)}`);
      socket.write(cmd + '\r\n');
    };

    const finish = (payload: { ok: true } | { ok: false; error: string }) => {
      try { socket.end(); } catch { /* ignore */ }
      resolve(payload);
    };

    const timer = setTimeout(() => finish({ ok: false, error: 'timeout' }), 15_000);

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      if (!buffer.endsWith('\r\n')) return;

      const lines = buffer.split('\r\n').filter(Boolean);
      buffer = '';

      for (const line of lines) {
        log(`<< ${line.slice(0, 60)}`);
        const code = parseInt(line.slice(0, 3), 10);

        if (step === 'EHLO') {
          if (code === 250) {
            send(`AUTH LOGIN`);
            step = 'AUTH';
            authStep = 'LOGIN_USER';
          } else return finish({ ok: false, error: `EHLO fallo: ${line}` });
        } else if (step === 'AUTH') {
          if (code === 334 && authStep === 'LOGIN_USER') {
            send(Buffer.from(cfg.user).toString('base64'));
            authStep = 'LOGIN_PASS';
          } else if (code === 334 && authStep === 'LOGIN_PASS') {
            send(Buffer.from(cfg.pass).toString('base64'));
            authStep = 'PLAIN';
          } else if (code === 235) {
            send(`MAIL FROM:<${cfg.user}>`);
            step = 'MAIL';
          } else return finish({ ok: false, error: `AUTH fallo: ${line}` });
        } else if (step === 'MAIL') {
          if (code === 250) {
            send(`RCPT TO:<${cfg.to}>`);
            step = 'RCPT';
          } else return finish({ ok: false, error: `MAIL fallo: ${line}` });
        } else if (step === 'RCPT') {
          if (code === 250) {
            send(`DATA`);
            step = 'DATA';
          } else return finish({ ok: false, error: `RCPT fallo: ${line}` });
        } else if (step === 'DATA') {
          if (code === 354) {
            const headers = [
              `From: ${cfg.user}`,
              `To: ${cfg.to}`,
              `Subject: ${subject}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/plain; charset=utf-8`,
              ``,
              body,
              `.`,
            ].join('\r\n');
            send(headers);
            step = 'QUIT';
          } else return finish({ ok: false, error: `DATA fallo: ${line}` });
        } else if (step === 'QUIT') {
          if (code === 250) {
            clearTimeout(timer);
            finish({ ok: true });
          } else return finish({ ok: false, error: `Envio fallo: ${line}` });
        }
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      finish({ ok: false, error: err.message });
    });

    socket.on('connect', () => {
      log(`Conectado a ${target}:${cfg.port}`);
      send(`EHLO ${domain}`);
    });
  });
};

export const notifyAdmin = async (subject: string, body: string): Promise<void> => {
  const cfg = loadSmtpConfig();
  if (!cfg) {
    console.warn(`[notifyAdmin] SMTP no configurado. Skip. subject="${subject}"`);
    return;
  }
  const result = await sendEmail(subject, body, cfg);
  if (!result.ok) {
    console.error(`[notifyAdmin] fallo: ${result.error}`);
  } else {
    console.log(`[notifyAdmin] enviado: ${subject}`);
  }
};