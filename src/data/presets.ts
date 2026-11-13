import type { BillingCycle, Category, Currency, SubscriptionItem } from '../types/subscription';

export interface QuickTemplate {
  name: string;
  category: Category;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  notes?: string;
}

export const DEFAULT_EXCHANGE_RATE = 32.5;

export const STARTER_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'preset-chatgpt',
    name: 'ChatGPT Plus',
    category: 'ai',
    price: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    billingDay: 5,
    active: true,
    notes: 'OpenAI 日常對話與研究主力',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-claude-code',
    name: 'Claude Pro / Code',
    category: 'ai',
    price: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    billingDay: 12,
    active: true,
    notes: '程式開發與深度架構分析',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-google-pro',
    name: 'Google AI Pro',
    category: 'ai',
    price: 650,
    currency: 'TWD',
    billingCycle: 'monthly',
    billingDay: 18,
    active: true,
    notes: 'Google One AI 進階方案 + 2TB 雲端',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-youtube',
    name: 'YouTube Premium',
    category: 'media',
    price: 199,
    currency: 'TWD',
    billingCycle: 'monthly',
    billingDay: 22,
    active: true,
    notes: '無廣告觀看與背景播放（台幣扣款）',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-medium',
    name: 'Medium Membership',
    category: 'writing',
    price: 5,
    currency: 'USD',
    billingCycle: 'monthly',
    billingDay: 9,
    active: true,
    notes: '技術文章與產業深度閱讀寫作',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-notion',
    name: 'Notion Plus',
    category: 'writing',
    price: 10,
    currency: 'USD',
    billingCycle: 'monthly',
    billingDay: 27,
    active: true,
    notes: '知識庫與文章草稿整理',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-netflix',
    name: 'Netflix 標準方案',
    category: 'media',
    price: 380,
    currency: 'TWD',
    billingCycle: 'monthly',
    billingDay: 15,
    active: false,
    notes: '目前暫停中（模擬省錢開關）',
    updatedAt: new Date().toISOString(),
  },
];

export const QUICK_TEMPLATES: QuickTemplate[] = [
  { name: 'ChatGPT Plus', category: 'ai', price: 20, currency: 'USD', billingCycle: 'monthly' },
  { name: 'ChatGPT Pro', category: 'ai', price: 200, currency: 'USD', billingCycle: 'monthly' },
  { name: 'Claude Pro / Code', category: 'ai', price: 20, currency: 'USD', billingCycle: 'monthly' },
  { name: 'Claude Max', category: 'ai', price: 100, currency: 'USD', billingCycle: 'monthly' },
  { name: 'Google AI Pro', category: 'ai', price: 19.99, currency: 'USD', billingCycle: 'monthly' },
  { name: 'Cursor Pro', category: 'ai', price: 20, currency: 'USD', billingCycle: 'monthly' },
  { name: 'YouTube Premium', category: 'media', price: 199, currency: 'TWD', billingCycle: 'monthly' },
  { name: 'Netflix', category: 'media', price: 380, currency: 'TWD', billingCycle: 'monthly' },
  { name: 'Spotify', category: 'media', price: 149, currency: 'TWD', billingCycle: 'monthly' },
  { name: 'Medium', category: 'writing', price: 5, currency: 'USD', billingCycle: 'monthly' },
  { name: 'Substack', category: 'writing', price: 10, currency: 'USD', billingCycle: 'monthly' },
  { name: 'Notion Plus', category: 'writing', price: 10, currency: 'USD', billingCycle: 'monthly' },
];
