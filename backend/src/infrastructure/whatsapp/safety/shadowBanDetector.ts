import { PhoneEntry } from '../phonePool';

interface PhoneStats {
  inbounds: number[];
  outboundAttempts: number[];
  lastChecked: number;
}

export class ShadowBanDetector {
  private stats = new Map<string, PhoneStats>();
  private threshold = Number(process.env.WA_SHADOWBAN_THRESHOLD ?? 0.2);

  recordInbound(phoneId: string): void {
    this.touch(phoneId).inbounds.push(Date.now());
    this.trim(this.stats.get(phoneId)!.inbounds);
  }

  recordOutbound(phoneId: string): void {
    this.touch(phoneId).outboundAttempts.push(Date.now());
    this.trim(this.stats.get(phoneId)!.outboundAttempts);
  }

  evaluate(pool: PhoneEntry[]): { banned: string[]; warnings: string[] } {
    const banned: string[] = [];
    const warnings: string[] = [];
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const phone of pool) {
      const s = this.stats.get(phone.id);
      if (!s) continue;
      if (now - s.lastChecked < 60 * 60 * 1000) continue;
      s.lastChecked = now;

      const recentOut = s.outboundAttempts.filter((t) => now - t < day).length;
      const recentIn = s.inbounds.filter((t) => now - t < day).length;

      if (recentOut >= 10 && recentIn / recentOut < this.threshold) {
        banned.push(phone.id);
        console.warn(`[shadowBan] ${phone.id} ratio=${(recentIn / recentOut).toFixed(2)} sospechoso.`);
      } else if (recentOut >= 5 && recentIn / recentOut < this.threshold * 1.5) {
        warnings.push(phone.id);
        console.warn(`[shadowBan] ${phone.id} ratio=${(recentIn / recentOut).toFixed(2)} en observacion.`);
      }
    }
    return { banned, warnings };
  }

  private touch(id: string): PhoneStats {
    let s = this.stats.get(id);
    if (!s) {
      s = { inbounds: [], outboundAttempts: [], lastChecked: 0 };
      this.stats.set(id, s);
    }
    return s;
  }

  private trim(arr: number[]): void {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    while (arr.length && now - arr[0] > day) arr.shift();
  }
}

export const globalShadowDetector = new ShadowBanDetector();