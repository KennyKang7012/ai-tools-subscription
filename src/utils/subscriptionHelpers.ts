import type { SubscriptionItem } from '../types/subscription.ts';

export type SubscriptionFormData = Omit<SubscriptionItem, 'id' | 'updatedAt'>;

/**
 * 合併更新訂閱項目：
 * - 若切換為月繳（monthly）或明確未指定年繳月份（billingMonth === undefined），主動移除舊的 billingMonth
 */
export function applySubscriptionUpdate(
  existing: SubscriptionItem,
  data: SubscriptionFormData,
  updatedAt: string
): SubscriptionItem {
  const next: SubscriptionItem = {
    ...existing,
    ...data,
    updatedAt,
  };

  if (next.billingCycle === 'monthly' || data.billingMonth === undefined) {
    delete next.billingMonth;
  }

  return next;
}

/**
 * 將表單欄位轉換為標準化的 SubscriptionFormData
 */
export function buildSubscriptionFormData(input: {
  name: string;
  category: SubscriptionItem['category'];
  price: number;
  currency: SubscriptionItem['currency'];
  billingCycle: SubscriptionItem['billingCycle'];
  billingDay: number;
  billingMonth?: number;
  active: boolean;
  notes?: string;
}): SubscriptionFormData {
  const validMonth =
    input.billingCycle === 'yearly' &&
    typeof input.billingMonth === 'number' &&
    Number.isInteger(input.billingMonth) &&
    input.billingMonth >= 1 &&
    input.billingMonth <= 12
      ? input.billingMonth
      : undefined;

  return {
    name: input.name.trim(),
    category: input.category,
    price: input.price,
    currency: input.currency,
    billingCycle: input.billingCycle,
    billingDay: input.billingDay,
    billingMonth: validMonth,
    active: input.active,
    notes: input.notes?.trim() || undefined,
  };
}
