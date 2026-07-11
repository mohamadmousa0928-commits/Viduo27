import type { UserProfile } from './supabase';

export type FilterId = 'clear_edge' | 'deep_clean' | 'upscale_2x';

export type FilterDef = {
  id: FilterId;
  label: string;
  emoji: string;
  description: string;
  cost: number;
};

export const FILTERS: Record<FilterId, FilterDef> = {
  clear_edge: {
    id: 'clear_edge',
    label: 'Clear Edge',
    emoji: '✨',
    description: 'Sharpens edges and fine details',
    cost: 0.5,
  },
  deep_clean: {
    id: 'deep_clean',
    label: 'Deep Clean Ultra 4',
    emoji: '🧹',
    description: 'Removes noise, grain, compression artifacts',
    cost: 1.0,
  },
  upscale_2x: {
    id: 'upscale_2x',
    label: '2x Upscale 4',
    emoji: '🔍',
    description: 'Doubles resolution (targets 4K/8K output)',
    cost: 1.0,
  },
};

export const FILTER_LIST = Object.values(FILTERS);

export function totalCost(filterIds: FilterId[]): number {
  return filterIds.reduce((sum, id) => sum + FILTERS[id].cost, 0);
}

export type PlanId = 'free' | 'weekly' | 'monthly' | 'yearly';

export type PlanDef = {
  label: string;
  price: number;
  priceLabel: string;
  coins: number;
  maxFileSizeMB: number;
  queueLabel: string;
  queueWaitSeconds: number;
  durationDays: number;
  features: string[];
  borderClass: string;
  glowClass: string;
};

export const PLAN_CONFIG: Record<PlanId, PlanDef> = {
  free: {
    label: 'Free',
    price: 0,
    priceLabel: '$0',
    coins: 2.5,
    maxFileSizeMB: 100,
    queueLabel: 'Basic Queue',
    queueWaitSeconds: 1800,
    durationDays: 0,
    features: [
      '2.50 coins per day',
      'Basic Queue (5–60 min)',
      '100MB max file size',
      'Last 5 videos in history',
    ],
    borderClass: 'border-gray-700',
    glowClass: '',
  },
  weekly: {
    label: 'Weekly VIP',
    price: 15,
    priceLabel: '$15/week',
    coins: 50,
    maxFileSizeMB: 500,
    queueLabel: 'Fast Queue',
    queueWaitSeconds: 300,
    durationDays: 7,
    features: [
      '50 coins per week',
      'Fast Queue (under 5 min)',
      '500MB max file size',
      'Full video history',
      'No ads',
    ],
    borderClass: 'border-brand',
    glowClass: 'shadow-[0_0_24px_rgba(59,130,246,0.2)]',
  },
  monthly: {
    label: 'Monthly VIP',
    price: 25,
    priceLabel: '$25/month',
    coins: 250,
    maxFileSizeMB: 1024,
    queueLabel: 'Fast Queue',
    queueWaitSeconds: 300,
    durationDays: 30,
    features: [
      '250 coins per month',
      'Fast Queue (under 5 min)',
      '1GB max file size',
      'Full video history',
      'No ads',
    ],
    borderClass: 'border-vip-from',
    glowClass: 'shadow-[0_0_24px_rgba(124,58,237,0.2)]',
  },
  yearly: {
    label: 'Yearly VIP',
    price: 50,
    priceLabel: '$50/year',
    coins: 999,
    maxFileSizeMB: 2048,
    queueLabel: 'Priority Queue',
    queueWaitSeconds: 120,
    durationDays: 365,
    features: [
      '999 coins per year',
      'Priority Queue (under 2 min)',
      '2GB max file size',
      'Full video history + export',
      'No ads',
      '8K output priority',
    ],
    borderClass: 'border-gold',
    glowClass: 'shadow-[0_0_24px_rgba(245,158,11,0.3)]',
  },
};

export const PLAN_LIST: PlanId[] = ['free', 'weekly', 'monthly', 'yearly'];

export function getPlanConfig(plan: string) {
  return PLAN_CONFIG[plan as PlanId] ?? PLAN_CONFIG.free;
}

export function isVip(plan: string) {
  return plan !== 'free';
}

export function computeExpiryDate(plan: PlanId): string {
  const cfg = PLAN_CONFIG[plan];
  if (cfg.durationDays === 0) return '';
  const d = new Date();
  d.setDate(d.getDate() + cfg.durationDays);
  return d.toISOString();
}

// Accepted video formats
export const ACCEPTED_FORMATS = ['.mp4', '.mov', '.avi', '.mkv'];
export const ACCEPTED_MIME = 'video/mp4,video/quicktime,video/x-msvideo,video/x-matroska';

// Coin reset: free users get 2.50 coins every 24 hours
export const FREE_COIN_AMOUNT = 2.5;
export const FREE_COIN_RESET_HOURS = 24;

export function msUntilNextResetUTC(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return tomorrow.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function canAfford(profile: UserProfile | null, cost: number): boolean {
  return (profile?.coins_balance ?? 0) >= cost;
}
