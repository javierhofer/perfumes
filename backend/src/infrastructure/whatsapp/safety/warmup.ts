export interface WarmupConfig {
  days: number;
  startPerDay: number;
  endPerDay: number;
}

const DEFAULT: WarmupConfig = {
  days: 14,
  startPerDay: 5,
  endPerDay: 100,
};

export const loadWarmupConfig = (): WarmupConfig => ({
  days: Number(process.env.WA_WARMUP_DAYS ?? DEFAULT.days) || DEFAULT.days,
  startPerDay: Number(process.env.WA_WARMUP_START ?? DEFAULT.startPerDay) || DEFAULT.startPerDay,
  endPerDay: Number(process.env.WA_WARMUP_END ?? DEFAULT.endPerDay) || DEFAULT.endPerDay,
});

export const dailyLimit = (createdAt: number, now: number = Date.now()): number => {
  const cfg = loadWarmupConfig();
  const ageDays = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000));
  if (ageDays >= cfg.days) return cfg.endPerDay;

  const progress = ageDays / cfg.days;
  const limit = Math.floor(cfg.startPerDay + (cfg.endPerDay - cfg.startPerDay) * progress);
  return Math.max(1, limit);
};

export const isWarmingUp = (createdAt: number, now: number = Date.now()): boolean => {
  const cfg = loadWarmupConfig();
  return now - createdAt < cfg.days * 24 * 60 * 60 * 1000;
};