export interface StorageReadResult {
  value: string | null;
  error?: string;
}

export interface StorageWriteResult {
  ok: boolean;
  error?: string;
}

/**
 * 安全讀取儲存空間（捕捉 SecurityError 等例外）
 */
export function safeGetStorageItem(
  storage: Pick<Storage, 'getItem'> | undefined,
  key: string
): StorageReadResult {
  if (!storage) {
    return { value: null, error: '目前環境不支援瀏覽器本機儲存' };
  }
  try {
    return { value: storage.getItem(key) };
  } catch {
    return {
      value: null,
      error: '無法讀取瀏覽器儲存空間（可能受無痕模式或隱私設定限制），目前以暫存狀態運行。',
    };
  }
}

/**
 * 安全寫入儲存空間（捕捉 QuotaExceededError / SecurityError 等例外）
 */
export function safeSetStorageItem(
  storage: Pick<Storage, 'setItem'> | undefined,
  key: string,
  value: string
): StorageWriteResult {
  if (!storage) {
    return { ok: false, error: '目前環境不支援瀏覽器本機儲存，變更尚未保存。' };
  }
  try {
    storage.setItem(key, value);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: '瀏覽器儲存空間寫入失敗（可能是空間已滿或權限受限），目前變更僅暫存於記憶體，建議立即匯出 JSON 備份。',
    };
  }
}

/**
 * 僅在明確允許持久化（非損壞資料保護狀態）時寫入訂閱清單
 */
export function persistItemsIfAllowed(
  storage: Pick<Storage, 'setItem'> | undefined,
  key: string,
  serializedItems: string,
  allowPersist: boolean
): StorageWriteResult {
  if (!allowPersist) {
    return { ok: true };
  }
  return safeSetStorageItem(storage, key, serializedItems);
}
