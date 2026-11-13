import type { Currency, SubscriptionItem } from '../types/subscription';

/**
 * 將單筆訂閱換算為「每月原幣別金額」（年繳自動除 12 攤提）
 */
export function getMonthlyNativePrice(item: SubscriptionItem): number {
  return item.billingCycle === 'yearly' ? item.price / 12 : item.price;
}

/**
 * 將單筆訂閱換算為「每月台幣金額 (TWD)」
 */
export function getMonthlyCostInTWD(item: SubscriptionItem, exchangeRate: number): number {
  const monthlyNative = getMonthlyNativePrice(item);
  return item.currency === 'USD' ? monthlyNative * exchangeRate : monthlyNative;
}

/**
 * 將單筆訂閱換算為「每月美金金額 (USD)」
 */
export function getMonthlyCostInUSD(item: SubscriptionItem, exchangeRate: number): number {
  const monthlyNative = getMonthlyNativePrice(item);
  if (item.currency === 'USD') return monthlyNative;
  return exchangeRate > 0 ? monthlyNative / exchangeRate : 0;
}

/**
 * 依據主顯示幣別取得每月金額
 */
export function getMonthlyCostInDisplayCurrency(
  item: SubscriptionItem,
  displayCurrency: Currency,
  exchangeRate: number
): number {
  return displayCurrency === 'TWD'
    ? getMonthlyCostInTWD(item, exchangeRate)
    : getMonthlyCostInUSD(item, exchangeRate);
}

/**
 * 格式化貨幣顯示
 */
export function formatCurrency(amount: number, currency: Currency, decimals?: number): string {
  if (currency === 'TWD') {
    const digits = decimals ?? 0;
    return `NT$ ${amount.toLocaleString('zh-TW', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }
  const digits = decimals ?? 2;
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/**
 * 計算距離下次扣款還有幾天（以本月/下月計算）
 */
export function getDaysUntilBilling(billingDay: number, fromDate = new Date()): number {
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const currentMonthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const clampedDayThisMonth = Math.min(billingDay, currentMonthDays);

  let target = new Date(today.getFullYear(), today.getMonth(), clampedDayThisMonth);
  if (target < today) {
    const nextMonthDays = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
    const clampedDayNextMonth = Math.min(billingDay, nextMonthDays);
    target = new Date(today.getFullYear(), today.getMonth() + 1, clampedDayNextMonth);
  }

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
