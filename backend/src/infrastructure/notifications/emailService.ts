const PREFIX_CRITICAL = '[WHATSAPP-CRITICAL]';
const PREFIX_WARN = '[WHATSAPP-WARN]';
const PREFIX_RECOVERED = '[WHATSAPP-RECOVERED]';

const isCritical = (subject: string): boolean =>
  /banned|baneo|BANEADO/i.test(subject);

const isRecovered = (subject: string): boolean =>
  /reconnect|reconex|se reconecto|RECONECTO/i.test(subject);

export const notifyAdmin = async (subject: string, body: string): Promise<void> => {
  const lines = body.split('\n');
  const banner = `${PREFIX_CRITICAL === '[WHATSAPP-CRITICAL]' ? '' : ''}`;
  void banner;

  if (isRecovered(subject)) {
    console.log(`${PREFIX_RECOVERED} ${subject}`);
  } else if (isCritical(subject)) {
    console.error(`${PREFIX_CRITICAL} ${subject}`);
    for (const line of lines) console.error(`  ${line}`);
    console.error('---');
  } else {
    console.warn(`${PREFIX_WARN} ${subject}`);
    for (const line of lines) console.warn(`  ${line}`);
    console.warn('---');
  }
};
