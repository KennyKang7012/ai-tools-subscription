# AGENTS.md — AI 開發協作指引

本文件提供給在此專案中協作的 AI 代理（Coding Agents）參考，確保架構一致性、型別安全與戰情室 UI 風格一致。

## 專案概覽

- **目標**：純前端個人訂閱費用戰情室儀表板（Zero-Backend，使用 `localStorage` 持久化 + JSON 匯出／匯入）。
- **技術棧**：Vite 6 + React 19 + TypeScript（`strict: true`）+ Tailwind CSS v4（`@tailwindcss/vite`）+ `lucide-react`。
- **語系與顯示**：繁體中文（`zh-Hant`）為主，金額與數字統一使用 `.font-mono-nums`（`tabular-nums`）對齊。

## 關鍵設計與不變原則（Invariants）

1. **雙幣別與週期計算集中管理**：
   - 所有金額換算（USD ↔ TWD）、年繳 `/ 12` 攤提、格式化與扣款倒數邏輯，必須集中在 `src/utils/currency.ts`，切勿在元件內重複實作計算公式。
2. **純前端零後端依賴**：
   - 保持開箱即用特性，不引入需要額外啟動的後端伺服器或資料庫。
   - 若呼叫外部 API（如 `HeaderBar.tsx` 的即時匯率抓取），必須具備 graceful fallback，離線或失敗時不得影響手動輸入與主流程。
3. **輕量圖表與無額外肥大依賴**：
   - 圖表目前採用純 SVG 與 Tailwind 繪製（見 `AnalyticsSection.tsx`），若無必要不引入大型圖表套件。
4. **資料向下相容**：
   - `localStorage` key 定義於 `src/App.tsx` 的 `STORAGE_KEYS`（`warroom_subscriptions_v1` 等）。若變更 `SubscriptionItem` 欄位，請確保能安全讀取舊格式或提供預設值。

## 常用指令

- `npm run dev`：啟動本機開發伺服器（預設埠號 `5173`）。
- `npm run build`：執行 `tsc -b && vite build`，任何程式修改完成後**必須**執行此指令確認無 TypeScript 型別錯誤與建置警告。
- `npm run preview`：預覽 `dist/` 正式建置產物。

## 程式碼規範

- 嚴格遵守 `tsconfig.app.json`（含 `noUnusedLocals`、`noUnusedParameters`）。
- 新增分類或修改分類色票時，請統一維護 `src/types/subscription.ts` 中的 `CATEGORY_META`。
- 預設展示清單與快速帶入模板集中維護於 `src/data/presets.ts`。
