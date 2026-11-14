export type Currency = 'USD' | 'TWD';
export type BillingCycle = 'monthly' | 'yearly';
export type Category = 'ai' | 'writing' | 'media' | 'other';

export interface SubscriptionItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  billingDay: number; // 1-31
  billingMonth?: number; // 1-12，年繳扣款月份（選填，向下相容舊資料）
  active: boolean;
  notes?: string;
  updatedAt: string;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  shortLabel: string;
  color: string;       // Hex for SVG charts
  badgeClass: string;  // Tailwind classes for pills
  glowClass: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  ai: {
    id: 'ai',
    label: 'AI 工具',
    shortLabel: 'AI',
    color: '#22d3ee', // cyan-400
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    glowClass: 'shadow-[0_0_15px_rgba(34,211,238,0.18)]',
  },
  writing: {
    id: 'writing',
    label: '文章寫作',
    shortLabel: '寫作',
    color: '#a78bfa', // violet-400
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    glowClass: 'shadow-[0_0_15px_rgba(167,139,250,0.18)]',
  },
  media: {
    id: 'media',
    label: '影音平台',
    shortLabel: '影音',
    color: '#fbbf24', // amber-400
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    glowClass: 'shadow-[0_0_15px_rgba(251,191,36,0.18)]',
  },
  other: {
    id: 'other',
    label: '雲端與其他',
    shortLabel: '其他',
    color: '#34d399', // emerald-400
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    glowClass: 'shadow-[0_0_15px_rgba(52,211,153,0.18)]',
  },
};
