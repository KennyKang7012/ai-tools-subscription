import type {
  BillingCycle,
  Category,
  Currency,
  SubscriptionItem,
} from '../types/subscription.ts';

const VALID_CATEGORIES = new Set<Category>(['ai', 'writing', 'media', 'other']);
const VALID_CURRENCIES = new Set<Currency>(['USD', 'TWD']);
const VALID_CYCLES = new Set<BillingCycle>(['monthly', 'yearly']);

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ImportPayloadResult {
  items: SubscriptionItem[];
  exchangeRate?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 驗證單筆訂閱資料是否合法，並回傳標準化後的 SubscriptionItem
 */
export function validateSubscriptionItem(
  raw: unknown,
  index: number
): ValidationResult<SubscriptionItem> {
  const prefix = `第 ${index + 1} 筆資料`;

  if (!isPlainObject(raw)) {
    return { ok: false, error: `${prefix}必須為物件格式` };
  }

  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    return { ok: false, error: `${prefix}缺少有效的 id` };
  }

  if (typeof raw.name !== 'string' || raw.name.trim() === '') {
    return { ok: false, error: `${prefix}缺少有效的工具名稱` };
  }

  if (typeof raw.category !== 'string' || !VALID_CATEGORIES.has(raw.category as Category)) {
    return { ok: false, error: `${prefix}（${raw.name}）分類無效` };
  }

  if (typeof raw.price !== 'number' || !Number.isFinite(raw.price) || raw.price < 0) {
    return { ok: false, error: `${prefix}（${raw.name}）金額必須為大於等於 0 的有限數字` };
  }

  if (typeof raw.currency !== 'string' || !VALID_CURRENCIES.has(raw.currency as Currency)) {
    return { ok: false, error: `${prefix}（${raw.name}）幣別僅支援 USD 或 TWD` };
  }

  if (
    typeof raw.billingCycle !== 'string' ||
    !VALID_CYCLES.has(raw.billingCycle as BillingCycle)
  ) {
    return { ok: false, error: `${prefix}（${raw.name}）計費週期僅支援 monthly 或 yearly` };
  }

  if (
    typeof raw.billingDay !== 'number' ||
    !Number.isInteger(raw.billingDay) ||
    raw.billingDay < 1 ||
    raw.billingDay > 31
  ) {
    return { ok: false, error: `${prefix}（${raw.name}）扣款日必須為 1–31 的整數` };
  }

  let billingMonth: number | undefined;
  if (raw.billingMonth !== undefined && raw.billingMonth !== null) {
    if (
      typeof raw.billingMonth !== 'number' ||
      !Number.isInteger(raw.billingMonth) ||
      raw.billingMonth < 1 ||
      raw.billingMonth > 12
    ) {
      return { ok: false, error: `${prefix}（${raw.name}）年繳月份必須為 1–12 的整數` };
    }
    billingMonth = raw.billingMonth;
  }

  if (typeof raw.active !== 'boolean') {
    return { ok: false, error: `${prefix}（${raw.name}）active 狀態必須為布林值` };
  }

  if (raw.notes !== undefined && typeof raw.notes !== 'string') {
    return { ok: false, error: `${prefix}（${raw.name}）備註格式必須為文字` };
  }

  if (raw.updatedAt !== undefined && typeof raw.updatedAt !== 'string') {
    return { ok: false, error: `${prefix}（${raw.name}）updatedAt 格式無效` };
  }

  return {
    ok: true,
    data: {
      id: raw.id.trim(),
      name: raw.name.trim(),
      category: raw.category as Category,
      price: raw.price,
      currency: raw.currency as Currency,
      billingCycle: raw.billingCycle as BillingCycle,
      billingDay: raw.billingDay,
      ...(billingMonth !== undefined ? { billingMonth } : {}),
      active: raw.active,
      ...(typeof raw.notes === 'string' && raw.notes.trim() ? { notes: raw.notes.trim() } : {}),
      updatedAt:
        typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
          ? raw.updatedAt
          : new Date().toISOString(),
    },
  };
}

/**
 * 逐筆驗證訂閱陣列並檢查重複 ID（任一筆失敗即整份拒絕）
 */
export function validateSubscriptionList(rawList: unknown): ValidationResult<SubscriptionItem[]> {
  if (!Array.isArray(rawList)) {
    return { ok: false, error: '訂閱清單必須為陣列格式' };
  }

  const validated: SubscriptionItem[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < rawList.length; i++) {
    const res = validateSubscriptionItem(rawList[i], i);
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error };
    }
    if (seenIds.has(res.data.id)) {
      return {
        ok: false,
        error: `發現重複的訂閱 ID（${res.data.id}），請確認備份資料是否正確`,
      };
    }
    seenIds.add(res.data.id);
    validated.push(res.data);
  }

  return { ok: true, data: validated };
}

/**
 * 驗證 JSON 匯入內容（支援純陣列或 { items, exchangeRate } 物件）
 */
export function validateImportPayload(rawJsonText: string): ValidationResult<ImportPayloadResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    return { ok: false, error: 'JSON 解析失敗，檔案內容不是有效的 JSON' };
  }

  const rawItems = Array.isArray(parsed)
    ? parsed
    : isPlainObject(parsed)
      ? parsed.items
      : undefined;

  const listResult = validateSubscriptionList(rawItems);
  if (!listResult.ok || !listResult.data) {
    return { ok: false, error: listResult.error ?? '匯入清單格式不正確' };
  }

  let exchangeRate: number | undefined;
  if (!Array.isArray(parsed) && isPlainObject(parsed) && parsed.exchangeRate !== undefined) {
    if (
      typeof parsed.exchangeRate !== 'number' ||
      !Number.isFinite(parsed.exchangeRate) ||
      parsed.exchangeRate <= 0
    ) {
      return { ok: false, error: '匯入檔案中的 exchangeRate 必須為大於 0 的有限數字' };
    }
    exchangeRate = parsed.exchangeRate;
  }

  return {
    ok: true,
    data: {
      items: listResult.data,
      exchangeRate,
    },
  };
}
