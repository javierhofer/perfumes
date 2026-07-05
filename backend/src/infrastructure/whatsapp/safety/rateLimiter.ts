interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitConfig {
  maxPerHour: number;
  perRecipientCooldownMs: number;
}

const DEFAULT: RateLimitConfig = {
  maxPerHour: Number(process.env.WA_MAX_PER_HOUR ?? 30) || 30,
  perRecipientCooldownMs: Number(process.env.WA_RECIPIENT_COOLDOWN_MS ?? 5 * 60 * 1000),
};

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private recipientLast = new Map<string, number>();
  private cfg: RateLimitConfig;

  constructor(cfg: Partial<RateLimitConfig> = {}) {
    this.cfg = { ...DEFAULT, ...cfg };
  }

  canSend(phoneId: string, to: string): { ok: boolean; reason?: string; retryInMs?: number } {
    const now = Date.now();
    const last = this.recipientLast.get(`${phoneId}:${to}`);
    if (last && now - last < this.cfg.perRecipientCooldownMs) {
      return { ok: false, reason: 'recipient_cooldown', retryInMs: this.cfg.perRecipientCooldownMs - (now - last) };
    }

    let bucket = this.buckets.get(phoneId);
    if (!bucket) {
      bucket = { tokens: this.cfg.maxPerHour, lastRefill: now };
      this.buckets.set(phoneId, bucket);
    }
    const elapsedHours = (now - bucket.lastRefill) / (60 * 60 * 1000);
    const refilled = Math.min(this.cfg.maxPerHour, bucket.tokens + elapsedHours * this.cfg.maxPerHour);
    bucket.tokens = refilled;
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      const deficit = 1 - bucket.tokens;
      const retryInMs = (deficit / this.cfg.maxPerHour) * 60 * 60 * 1000;
      return { ok: false, reason: 'hourly_limit', retryInMs };
    }

    return { ok: true };
  }

  consume(phoneId: string, to: string): void {
    const bucket = this.buckets.get(phoneId);
    if (bucket && bucket.tokens >= 1) bucket.tokens -= 1;
    this.recipientLast.set(`${phoneId}:${to}`, Date.now());
  }

  snapshot(phoneId: string) {
    const bucket = this.buckets.get(phoneId);
    return {
      tokensLeft: bucket ? Math.floor(bucket.tokens) : this.cfg.maxPerHour,
      maxPerHour: this.cfg.maxPerHour,
    };
  }
}

export const globalLimiter = new RateLimiter();