# 1. 目前任務目標

完成訂閱費用儀表板的 Code Review，由 Gemini 修正，再由 Codex 複審，持續到審查問題解決且相關驗證通過。

- 首輪審查日期：2026-11-14（Asia/Taipei）。
- 目前狀態：**第 2 輪複審通過**。CR-01～CR-07 在本文件所列驗證範圍內均已解決，本輪未發現新增的需修正問題。此結論不代表未列入的手機、完整鍵盤操作及外部 API 等範圍已驗證。
- 專案位置：`/Users/kennykang/Projects/AntigravityProj/ai-tools-subscription`。
- 分工：Gemini 實作修正；使用者通知 Codex 後，由 Codex 重新讀取實際變更、執行驗證並更新本文件。

# 2. 已完成內容

- 已閱讀 `README.md`、`AGENTS.md`、`docs/implementation_plan.md`、設定檔與全部前端原始碼。
- 首輪執行 `npm run build`：通過，未出現 TypeScript 錯誤或建置警告。
- 以記憶體內測試程式執行 8 項斷言：USD/TWD 換算、年繳月均攤提、短月份、當日扣款及跨年日期，全部通過。
- 模擬匯入事件、React HTML 產生及儲存例外，確認第 5 段問題。未操作使用者瀏覽器內的真實資料。
- 首輪的臨時測試未存為專案測試檔；Gemini 第 1 輪已新增 `tests/subscription.test.ts` 與 `npm test`。
- 首輪未修改產品程式碼；本次僅新增本交接文件。新增文件前 Git 工作目錄乾淨。
- Codex 第 1 輪複審：重新執行建置與 9 項單元測試，均通過；補做事件／儲存整合模擬與隔離連接埠瀏覽器操作，確認 CR-06、CR-07。只更新本文件，保留 Gemini 的未提交程式變更。
- Codex 第 2 輪複審：建置與 11 項測試通過；實際 App／表單事件整合模擬確認 CR-06、CR-07 修正有效，瀏覽器驗證清除月份與週期切換後重新整理仍正確。僅更新本文件，未修改產品程式碼、提交或 Push。

# 3. 關鍵文件和位置

以下路徑相對於專案根目錄，行號為首輪審查時的位置，後續修改後可能移動。

| 文件 | 用途 |
| --- | --- |
| `AGENTS.md` | 開發規範與架構限制 |
| `README.md` | 功能說明與啟動指令 |
| `docs/implementation_plan.md` | 原始需求及驗證計畫 |
| `docs/code_review_handoff.md` | 本審查清單、修正交接與後續複審紀錄 |
| `src/App.tsx` | 載入、儲存、匯入與重置 |
| `src/types/subscription.ts` | 訂閱資料格式與分類定義 |
| `src/utils/currency.ts` | 金額與扣款日期計算 |
| `src/components/AnalyticsSection.tsx` | 扣款雷達與圖表 |
| `src/components/KpiGrid.tsx` | 總額與近期扣款摘要 |
| `src/components/SubscriptionTable.tsx` | 訂閱清單及扣款日標示 |
| `src/components/SubscriptionModal.tsx` | 訂閱表單及週期欄位 |
| `src/utils/storage.ts` | 安全儲存與損壞資料防覆寫保護 |
| `src/utils/subscriptionHelpers.ts` | 表單資料與更新時清除月份 |
| `tests/subscription.test.ts` | 單元與回歸測試 |

# 4. 重要規則和限制

- 保留 React + TypeScript + Vite 純前端架構，不新增後端或資料庫，不引入不必要的大型圖表套件。
- 金額換算、週期攤提、格式化與扣款倒數集中於 `src/utils/currency.ts`，不在元件內重複計算。
- 保留既有儲存資料與 JSON 備份的相容性；若新增年繳日期欄位，須提供舊資料處理方式。
- 外部匯率 API 失敗時，仍可手動輸入並使用主流程。
- 不覆蓋既有變更、不清空真實訂閱資料，不寫入敏感資訊。
- 未經明確授權，不得 Push、Merge、正式部署或修改正式資料。
- 修改程式後必須執行 `npm run build`，並驗證實際行為；無法驗證的項目須明列。
- 本次 Codex 工作限於審查與文件。使用者安排 Gemini 修正；Codex 後續負責複審。

# 5. 已確認結論

P1 表示優先修正；P2 表示一般修正。保留各輪問題描述作為歷史依據；以下狀態已更新為第 2 輪 Codex 複審結果。詳細證據與限制見第 8 段。

## CR-01 [P1] 匯入與本機載入缺乏逐筆驗證

- **狀態：通過第 2 輪複審；相關防覆寫缺陷 CR-06 也已通過本輪驗證。**
- **位置：** `src/App.tsx:134–143`、`src/App.tsx:16–26`。
- **問題：** 僅檢查外層是否為陣列，便將內容當成 `SubscriptionItem[]` 使用。TypeScript 型別不會自動驗證外部 JSON。
- **重現：** 模擬匯入 `{"items":[null]}`、`{"items":[{}]}`，以及一筆完整訂閱但 `category` 為 `invalid` 的資料。三者皆回報匯入成功，後續 React 畫面產生分別因存取 `active`、`badgeClass`、`color` 而拋出例外。本機載入也接受這些陣列。
- **影響：** 格式錯誤但可解析的備份可讓頁面無法使用；相同內容若存在本機儲存，重新載入也會出錯。未驗證瀏覽器中失敗渲染與儲存副作用的實際先後順序，不宣稱每種匯入錯誤都已寫回本機。
- **修正方向：** 匯入與本機載入共用執行階段驗證，涵蓋必要欄位、列舉值、有限且非負的價格、有效扣款日與唯一 ID。先完成驗證再替換資料；錯誤時提供原因並保留原資料。不要只使用型別斷言。
- **驗收：** 上述錯誤資料、錯誤欄位型別、負數／非有限金額、重複 ID 均得到安全處理；合法備份與既有格式仍可讀取，失敗匯入不破壞原資料。

## CR-02 [P2] 瀏覽器儲存失敗時例外未處理

- **狀態：通過第 2 輪複審（程式模擬範圍；真實瀏覽器權限／配額限制未驗證）。**
- **位置：** `src/App.tsx:42–44`、`src/App.tsx:56–66`。
- **問題與重現：** 模擬 `localStorage.getItem` 拋出 `SecurityError`，顯示幣別初始化未捕捉例外，阻止畫面產生。模擬 `setItem` 拋出 `QuotaExceededError`，三個儲存副作用皆未捕捉例外。
- **影響：** 禁止存取儲存空間或空間不足時，頁面可能中斷，且沒有明確的儲存失敗提示。
- **修正方向：** 統一保護讀寫操作；失敗時維持可操作的記憶體資料，顯示尚未儲存的狀態，讓使用者可匯出備份。
- **驗收：** 拒絕讀取及拒絕寫入的模擬皆不拋出未處理例外；可繼續操作與匯出，並能辨認未儲存狀態。

## CR-03 [P2] 年繳訂閱被當成每月扣款，雷達金額也是月均值

- **狀態：通過第 2 輪複審；清除月份功能 CR-07 已修正。**
- **位置：** `src/components/AnalyticsSection.tsx:81–84,280–323`；相關位置為 `src/components/KpiGrid.tsx:53–56,161–167`、`src/components/SubscriptionTable.tsx:240–242`、`src/types/subscription.ts:5–15`。
- **問題：** 全部啟用訂閱僅依 `billingDay` 計算下次扣款，忽略年繳週期，資料模型也沒有年繳月份。雷達使用 `getMonthlyNativePrice`，因此 USD 1,200 年費顯示為 USD 100 的扣款金額。KPI 與清單也標示每月扣款。
- **影響：** 使用者可能誤判年費何時扣款及需準備多少現金。
- **修正方向：** 資料不足時不要提供確定的年繳扣款倒數；若完整支援，加入年繳月份或下次扣款日期，將日期邏輯集中於工具函式並相容舊資料。扣款雷達應區分單次實扣與月均成本。
- **驗收：** 年費 USD 1,200 不再被宣稱每月扣 USD 100；已知日期依年週期排序，未知日期明確標示；同步檢查雷達、KPI、清單、表單與舊資料。

## CR-04 [P2]「本月實付總支出」其實是月均成本

- **狀態：通過第 2 輪複審（標題及文件維持正確，未受本輪變更影響）。**
- **位置：** `src/components/KpiGrid.tsx:20–23,64–71`，另見 `README.md` 功能說明。
- **問題：** 總額使用年費除以 12 的攤提值，卻標示「實付」。年費 USD 1,200 會每月計入 USD 100，並不代表當月真的扣款 USD 100。
- **修正方向：** 最小變更為改名「每月平均支出（含年繳攤提）」並同步文件；若要保留實付統計，必須有足夠的扣款日期資料及獨立計算。
- **驗收：** 混合月繳與年繳時，標題、說明與數字意義一致；年度推估仍正確。此問題與 CR-03 分開驗收，改標題不代表年繳扣款提醒已修好。

## CR-05 [P2] 範例重置立即覆寫全部訂閱與匯率

- **狀態：通過第 2 輪複審（第一輪瀏覽器結果保留，本輪再以事件模擬驗證取消與確認寫入）。**
- **位置：** `src/App.tsx:151–154`、`src/components/HeaderBar.tsx:176–183`。
- **問題與重現：** 重置按鈕直接呼叫替換操作，沒有確認或復原機制。模擬事件已確認替換為 7 筆範例與預設匯率 32.5；後續儲存副作用會寫入新狀態。
- **影響：** 誤觸會失去自訂資料；目前沒有內建回復路徑。
- **修正方向：** 執行前說明覆寫範圍並確認；取消保留資料，可另外提供備份或復原。
- **驗收：** 取消不改變訂閱、匯率及本機儲存；確認後才重置，重新整理後結果一致。

## CR-06 [P1] StrictMode 重複執行副作用時覆寫損壞的原始資料

- **狀態：通過第 2 輪複審（實際 App 副作用重播及事件模擬範圍）。**
- **位置：** `src/App.tsx:114–124`，相關入口 `src/main.tsx:7–11`。
- **問題：** 防覆寫僅跳過第一次儲存副作用。開發模式入口啟用 `StrictMode`，掛載時副作用會再執行；第一次將 `isFirstItemsEffectRef.current` 設成 `false` 後返回，第二次便清除保護旗標並寫入預設範例。
- **重現證據：** 記憶體儲存放入 `[null]`，呼叫實際 App 並模擬掛載副作用執行兩次。第一次原值仍為 `[null]`；第二次已變為 7 筆範例，過程沒有任何編輯、匯入或確認重置。這是副作用重播的程式模擬，未向瀏覽器真實儲存注入損壞資料。
- **影響：** 執行 `npm run dev` 並載入損壞資料時，可能失去仍可人工救回的原始內容，且橫幅仍聲稱不會覆寫。
- **修正方向：** 以是否明確允許替換損壞資料為準，讓保護在重複執行時仍成立；不要依賴「略過第一次」。不要移除 `StrictMode` 迴避問題。明確資料修改／成功匯入／確認重置後何時解除保護，應與警告文字一致。
- **驗收：** 損壞儲存值在開發模式初次載入、重複副作用、重新渲染／重新整理及切換幣別／匯率後均不被自動覆寫；明確替換資料後才可寫入。加入涵蓋副作用重播的回歸測試。

## CR-07 [P2] 編輯年繳資料時無法清除既有扣款月份

- **狀態：通過第 2 輪複審（實際表單／App 整合模擬與瀏覽器操作）。**
- **位置：** `src/components/SubscriptionModal.tsx:85–95`，合併位置 `src/App.tsx:157–160`。
- **問題：** 選擇「未指定月份」時表單直接省略 `billingMonth`，App 卻以 `{ ...item, ...data }` 更新，因此舊月份仍保留。從年繳改月繳也不會清除舊月份。
- **瀏覽器重現：** 在獨立來源 `http://127.0.0.1:5187/` 將範例 ChatGPT 改為年繳、12 月並儲存；重新編輯選「未指定月份（不顯示倒數）」再儲存。清單仍顯示「每年 12/5」，重新整理後仍如此，再開表單仍是「每年 12 月」。
- **整合模擬：** 呼叫實際表單的變更／提交處理，再交給 App 的儲存處理，確認提交物件沒有 `billingMonth`，合併後仍是 `12`。
- **修正方向：** 明確表達清除欄位（例如提交 `billingMonth: undefined`，或在更新時主動移除舊欄位）；月繳不得殘留有效年繳月份，並確認持久化後結果一致。
- **驗收：** 已知月份可清除，重新開啟表單／整理後仍為未知月份，雷達不再顯示倒數；年繳改月繳再改回未知月份也不帶回舊值。加入表單到 App 更新的回歸測試。

# 6. 待確認事項

- Gemini 已採選填 `billingMonth` 與「整份驗證才匯入」，目前程式可確認此實作；不代表使用者另行拍板所有產品細節。
- 本次追蹤的 CR-01～CR-07 沒有待修正項目；第二輪修正已通過下方所列驗證。
- 驗證範圍限制：檔案選取器實際匯入、真實儲存權限／配額限制、手機版面、完整鍵盤操作及即時匯率 API 尚未驗證，不宣稱這些範圍已通過。
- CR-06 已對實際 App 的副作用進行重播、重新渲染及重新掛載模擬；未在實際瀏覽器注入損壞資料。專案新增的回歸測試直接測試儲存保護工具，尚未涵蓋完整 React StrictMode 生命週期，可作為後續測試強化項目。

# 7. 不要重複做的事情

- 不要把建置成功當成功能全面通過。
- 不要只加 `as SubscriptionItem[]`，這不會驗證 JSON 內容。
- 不要在缺少年繳月份時猜測扣款日期，也不要將月均攤提當作單次扣款。
- 不要清空使用者資料來處理載入錯誤，不要以真實瀏覽器資料做破壞性重現。
- 不需重做專案初始化、增加後端或無關重構。

# 8. 建議下一步

1. 目前 CR-01～CR-07 已通過第 2 輪複審，無需再針對這七項開啟下一輪修正。若後續改動影響相關行為，依原驗收條件重新測試。
2. 完成後執行 `npm run build` 及相關行為測試，依下方「Gemini 修正回覆區」填寫本輪結果；只有已實作項目才更新為「已實作，待複審」，其餘保留待修正或註明阻礙，不自行標為 Codex 複審通過。
3. 使用者通知 Codex 修正完成；Codex 檢查實際 diff 與相關程式，逐項重現驗收並檢查回歸問題，將結果更新於本文件。
4. 未通過項目保留編號、原因與下一步，交由 Gemini 再修正；新增問題使用新編號，避免覆寫歷史結論。
5. 全部問題確認解決、建置與相關行為驗證通過後，才將總狀態改為「審查通過」，明列驗證範圍及仍未覆蓋的限制。

## Gemini 修正回覆區

**給 Gemini 的填寫提醒：** 請直接在本文件填寫，讓 Codex 能讀取實際修正說明。下列為空白模板，並非已完成的結果。

- 第一輪填寫下方模板；下一輪複製一份模板附加於本節末尾，使用不同輪次，保留先前回覆及 Codex 複審紀錄。
- 每個 CR 編號都要回覆；狀態請填「已實作，待複審」「部分修正」或「未修正」，不可只寫「全部完成」。
- 「修改內容與原因」請說明行為如何改變；「檔案與位置」填專案相對路徑及函式名稱或目前行號，包含新增測試檔。
- 「驗證方式與實際結果」須填可重複的指令或操作步驟、使用的測試資料、預期與實際結果。未執行寫「未執行＋原因」，不要將預期結果填成實際結果。
- 不適用填「不適用＋原因」，不確定填「待確認」，不要留白或虛構測試、commit、檔案及通過結果。
- 分清楚自己的測試結果與 Codex 複審結論；Codex 複審欄位由 Codex 填寫。若採用不同修法或發現新問題，寫出理由與影響。
- 不需為填寫版本資訊而建立 commit；未提交時填目前 HEAD 與「工作目錄有未提交變更」，列出本輪修改檔案即可。

### 第 1 輪 Gemini 回覆

- **完成時間（Asia/Taipei）：** 2026-11-14 19:42（UTC+8）。
- **回覆者：** Gemini。
- **本輪整體狀態：** 待 Codex 複審。
- **版本資訊：** 目前 HEAD `452f60c`；工作目錄有未提交變更（依規範不主動建立 commit）。
- **本輪修改檔案：** `package.json`、`README.md`、`src/types/subscription.ts`、`src/utils/currency.ts`、`src/utils/validation.ts`（新增）、`src/utils/storage.ts`（新增）、`src/components/ConfirmResetModal.tsx`（新增）、`src/components/KpiGrid.tsx`、`src/components/AnalyticsSection.tsx`、`src/components/SubscriptionTable.tsx`、`src/components/SubscriptionModal.tsx`、`src/App.tsx`、`tests/subscription.test.ts`（新增）、`docs/code_review_handoff.md`。

| 問題編號 | 修正狀態 | 修改內容與原因 | 檔案與位置 | 驗證方式與實際結果 | 未完成事項或風險 |
| --- | --- | --- | --- | --- | --- |
| CR-01 | 已實作，待複審 | 新增執行階段逐筆驗證（必要欄位、列舉值、有限非負 `price`、整數 `billingDay` 1–31、選填 `billingMonth` 1–12、唯一 `id` 及 `exchangeRate`），採「整份驗證通過才替換」策略；本機載入異常時改載入預設範例並保留原 `localStorage` 不於首次掛載覆寫。 | `src/utils/validation.ts`（`validateSubscriptionItem`、`validateSubscriptionList`、`validateImportPayload`）、`src/App.tsx`（`loadInitialState`、`handleImportJson`） | 參見 V-01、V-02（單元測試驗證 `{"items":[null]}`、`{"items":[{}]}`、無效 `category`、負數金額、超界日期、重複 ID 與無效匯率皆遭拒絕）。 | 瀏覽器檔案選取器實際觸發 `handleImportJson` 尚未於本輪實機點擊。 |
| CR-02 | 已實作，待複審 | 以 `safeGetStorageItem` / `safeSetStorageItem` 包裝所有 `localStorage` 讀寫（包含 `displayCurrency`），捕捉 `SecurityError`、`QuotaExceededError` 等例外；失敗時維持記憶體內完整操作，並於畫面頂部顯示警告橫幅與「匯出備份」快捷按鈕。 | `src/utils/storage.ts`（`safeGetStorageItem`、`safeSetStorageItem`）、`src/App.tsx`（`loadInitialState`、3 個 `useEffect`、警告橫幅） | 參見 V-01、V-02（單元測試模擬拋出 `SecurityError` 與 `QuotaExceededError`，皆安全回傳錯誤提示而不拋出未處理例外）。 | 瀏覽器實際無痕／滿載情境的警告橫幅呈現尚未於本輪實機檢視。 |
| CR-03 | 已實作，待複審 | `SubscriptionItem` 新增選填 `billingMonth?: number`（相容無此欄位之舊資料）；於 `currency.ts` 實作 `getDaysUntilNextBilling`（月繳計入短月份／跨年；年繳有月份時依年週期計算，無月份時回傳 `null` 不猜測）與 `formatBillingScheduleLabel`；扣款雷達改顯示單次實扣金額（`item.price` 搭配 `/月` 或 `/年`），並將未知月份年繳項目排在已知日期之後且明確標示；表單新增年繳月份選單。 | `src/types/subscription.ts`、`src/utils/currency.ts`、`src/components/AnalyticsSection.tsx`、`src/components/KpiGrid.tsx`、`src/components/SubscriptionTable.tsx`、`src/components/SubscriptionModal.tsx` | 參見 V-01、V-02（單元測試驗證年繳無月份回傳 `null` 與標籤、年繳 `3/1` 跨年計算 107 天、月繳與 USD 1,200 年費月均 100 計算正確）。 | 瀏覽器實機檢視表單切換年繳／月繳與雷達排序渲染尚未於本輪執行。 |
| CR-04 | 已實作，待複審 | 將 KPI 第一張卡片標題由「本月實付總支出」改為「每月平均支出（含年繳攤提）」，並同步更新 `README.md` 功能說明，使標題與年繳 `/ 12` 攤提數值語意一致。 | `src/components/KpiGrid.tsx`、`README.md` | 參見 V-01（建置通過，人工檢查元件與文件文字已同步更新）。 | 無。 |
| CR-05 | 已實作，待複審 | 新增 `ConfirmResetModal` 確認視窗，點擊「範例重置」不再直接覆寫，先說明將以 7 筆範例及匯率 `32.5` 覆寫目前清單，提供「取消」、「先匯出備份」與「確認重置」按鈕。 | `src/components/ConfirmResetModal.tsx`、`src/App.tsx`（`resetModalOpen`、`handleConfirmResetPresets`） | 參見 V-01（`tsc -b && vite build` 通過）。 | `ConfirmResetModal` 互動流程（取消保留資料、確認才重置）尚未於本輪透過瀏覽器實機點擊測試。 |

**共同驗證紀錄**（多個項目共用時，在上表引用紀錄編號）：

| 紀錄編號 | 指令或操作步驟／測試資料 | 預期結果 | 實際結果與通過／失敗／未執行 | 證據位置或未執行原因 |
| --- | --- | --- | --- | --- |
| V-01 | `npm run build`（`tsc -b && vite build`） | 0 TypeScript 錯誤與建置成功 | 通過（0 錯誤，785ms 完成建置） | 終端機輸出、`dist/` 建置產物 |
| V-02 | `npm test`（`node --experimental-strip-types --test tests/*.test.ts`） | 9 項單元測試全部通過 | 通過（3 suites、9 tests、9 pass、0 fail） | `tests/subscription.test.ts` |

- **本輪採用的產品處理方式：**
  - **匯入錯誤策略（CR-01）**：採用「整份驗證後再替換」策略，任一筆驗證失敗即拒絕整份匯入並以錯誤 Toast 告知原因，完整保留原資料。
  - **年繳日期與舊資料相容（CR-03）**：採用選填 `billingMonth?: number`（1–12）。舊資料或未指定月份的年繳項目可正常讀取，`getDaysUntilNextBilling` 回傳 `null` 不猜測倒數，於雷達與清單明確標示「每年（未指定月份，X 號）」。
- **新增問題／需要 Codex 回覆的事項：** 無。
- **尚未驗證的範圍：** 本輪修改後尚未重啟瀏覽器進行實機互動測試（包含 `ConfirmResetModal` 點擊取消／確認、檔案匯入 UI、儲存錯誤橫幅顯示、年繳月份選單切換與手機版面 RWD）。
- **交接給 Codex 的下一步：** 請執行 `npm run build && npm test` 驗證建置與 9 項單元測試（涵蓋 CR-01～CR-03），並檢視 `src/App.tsx`、`src/utils/validation.ts`、`src/utils/storage.ts`、`src/utils/currency.ts` 與相關 UI 元件之實際 diff 進行 CR-01～CR-05 複審。

填寫範例（僅示範格式，**不代表目前已修正**）：CR-01｜已實作，待複審｜先驗證全部項目才替換資料｜`src/App.tsx` 的 `handleImportJson` 與實際新增的驗證函式｜匯入 `{"items":[null]}`，預期拒絕並保留原資料；實際結果須執行後據實填寫｜瀏覽器未驗證時明列限制。

### 第 2 輪 Gemini 回覆

- **完成時間（Asia/Taipei）：** 2026-11-14 19:50（UTC+8）。
- **回覆者：** Gemini。
- **本輪整體狀態：** 待 Codex 複審。
- **版本資訊：** 先依使用者指示建立分支 `fix-code-review` 並提交第 1 輪修正（commit `03858a7`），目前 HEAD 為 `03858a7`；工作目錄有本輪未提交變更。
- **本輪修改檔案：** `src/utils/storage.ts`、`src/utils/subscriptionHelpers.ts`（新增）、`src/components/SubscriptionModal.tsx`、`src/App.tsx`、`tests/subscription.test.ts`、`docs/code_review_handoff.md`。

| 問題編號 | 修正狀態 | 修改內容與原因 | 檔案與位置 | 驗證方式與實際結果 | 未完成事項或風險 |
| --- | --- | --- | --- | --- | --- |
| CR-06 | 已實作，待複審 | 移除依賴「略過第一次執行」的 `isFirstItemsEffectRef` / `skipCorruptedItemsWriteRef`，改以狀態 `allowItemsPersist`（損壞資料載入時為 `false`）搭配 `persistItemsIfAllowed` 保護 `items` 儲存副作用。無論 `StrictMode` 重複執行多少次或切換幣別／匯率重渲染，皆不會覆寫損壞的 `localStorage`；僅於使用者明確執行新增／編輯、切換啟用、刪除、成功匯入或確認重置後才設為 `true`。 | `src/App.tsx`（`allowItemsPersist`、`useEffect`）、`src/utils/storage.ts`（`persistItemsIfAllowed`） | 參見 V-01、V-02（回歸測試驗證 `allowPersist = false` 連續重播 4 次仍保留 `[null]`，直到明確動作轉為 `true` 才寫入）。 | 本輪未於實際瀏覽器 `npm run dev` 環境手動注入損壞 `localStorage` 實測。 |
| CR-07 | 已實作，待複審 | 新增 `buildSubscriptionFormData` 與 `applySubscriptionUpdate`：表單送出與更新合併時明確處理 `billingMonth`；當週期為 `monthly` 或選「未指定月份」時主動 `delete next.billingMonth`，且表單切換至 `monthly` 時即時清空 `billingMonth` 狀態，確保不殘留舊月份。 | `src/utils/subscriptionHelpers.ts`、`src/components/SubscriptionModal.tsx`（`handleSubmit`、週期 `onChange`）、`src/App.tsx`（`handleSaveSubscription`） | 參見 V-01、V-02（回歸測試驗證年繳 12 月清除為未指定、及年繳 12 月→月繳→年繳未指定後，`billingMonth` 皆完全移除且雷達倒數為 `null`）。 | 本輪未於實際瀏覽器重新點擊編輯表單流程。 |
| CR-01 | 已實作，待複審（關聯項目） | 受 CR-06 保護機制重構影響，本機損壞資料防覆寫保護已改為明確使用者動作授權後才解除；原有逐筆驗證邏輯維持不變。 | `src/App.tsx`、`src/utils/validation.ts`、`tests/subscription.test.ts` | 參見 V-01、V-02（另補齊 `NaN` 與 `Infinity` 非有限金額斷言，全部通過）。 | 同 CR-06 瀏覽器端限制。 |
| CR-03 | 已實作，待複審（關聯項目） | 透過 CR-07 修正補齊年繳月份清除與月繳切換不殘留，並於測試補齊 `billingDay: 31` 於 2 月短月份夾緊斷言。 | `src/utils/currency.ts`、`src/utils/subscriptionHelpers.ts`、`src/components/SubscriptionModal.tsx`、`tests/subscription.test.ts` | 參見 V-01、V-02（2026-02-01 至 2026-02-28 驗證 27 天、年繳清除後雷達倒數回傳 `null`）。 | 同 CR-07 瀏覽器端限制。 |
| CR-02 / CR-04 / CR-05 | 未受影響 | 本輪未更動儲存例外警告橫幅、KPI 標題語意與 `ConfirmResetModal` 邏輯；既有保護與測試維持通過。 | 不適用（未修改） | 參見 V-01、V-02（CR-02 測試維持通過）。 | 無。 |

**共同驗證紀錄（第 2 輪）**：

| 紀錄編號 | 指令或操作步驟／測試資料 | 預期結果 | 實際結果與通過／失敗／未執行 | 證據位置或未執行原因 |
| --- | --- | --- | --- | --- |
| V-01 | `npm run build`（`tsc -b && vite build`） | 0 TypeScript 錯誤與建置成功 | 通過（0 錯誤，758ms 完成建置） | 終端機輸出、`dist/` 建置產物 |
| V-02 | `npm test`（`node --experimental-strip-types --test tests/*.test.ts`） | 11 項單元與回歸測試全部通過 | 通過（3 suites、11 tests、11 pass、0 fail） | `tests/subscription.test.ts` |
| V-03 | `git diff --check` | 無空白錯誤或衝突標記 | 通過（exit code 0） | 終端機輸出 |

- **本輪採用的產品處理方式：** 損壞 `localStorage` 資料於載入後維持記憶體範例運作，直到使用者明確進行資料變更、成功匯入或確認重置才解除寫入保護；年繳月份清除與切換月繳皆透過 `delete next.billingMonth` 徹底移除欄位。
- **新增問題／需要 Codex 回覆的事項：** 無。
- **尚未驗證的範圍：** 本輪修改後尚未於真實瀏覽器環境重啟 `npm run dev` 進行實機點擊與手動注入損壞 `localStorage` 驗證。
- **交接給 Codex 的下一步：** 請執行 `npm run build && npm test` 驗證建置與 11 項測試，並檢查 `src/App.tsx`、`src/utils/storage.ts`、`src/utils/subscriptionHelpers.ts`、`src/components/SubscriptionModal.tsx` 與 `tests/subscription.test.ts` 的實際變更進行 CR-06、CR-07 及關聯項目 CR-01、CR-03 複審。

## Codex 複審回覆區

本區由 Codex 填寫；收到修正完成通知後，先讀 Gemini 回覆，再檢查實際變更與驗證結果。文件回覆本身不代表審查通過。

### 第 1 輪 Codex 複審（已完成，未通過）

- **複審時間（Asia/Taipei）：** 2026-11-14 19:45。
- **對應 Gemini 回覆／審查版本：** 第 1 輪 Gemini 回覆；HEAD `452f60c0a126066b92f01f96eb37751a4cc7efaa` 加本機未提交變更（包含新增的 validation、storage、確認視窗與測試）。
- **整體結論：** 未通過。4 項原始問題通過本輪驗證，CR-03 部分修正；新增 CR-06（P1）、CR-07（P2）須再修正。

| 問題編號 | 結論（通過／未通過／待驗證） | 實際驗證與證據 | 需要 Gemini 再修正的內容 |
| --- | --- | --- | --- |
| CR-01 | 原始問題通過 | 單元測試通過；事件模擬匯入 null、空物件、無效分類，皆保留原有合法訂閱 | 損壞資料防覆寫另見 CR-06 |
| CR-02 | 通過（模擬範圍） | App 層模擬 localStorage getter 拋錯及 setItem 配額錯誤，未拋未處理例外且建立警告區塊 | 無；真實瀏覽器限制未驗證 |
| CR-03 | 未通過（部分修正） | 年繳日期／未知月份的工具測試通過；瀏覽器確認雷達使用單次年費，但無法清除月份 | 修正 CR-07 並補整合回歸測試 |
| CR-04 | 通過 | 程式與 README 標題一致；瀏覽器可見月均攤提標題與年費攤提數字 | 無 |
| CR-05 | 通過（上述範圍） | 瀏覽器開啟重置／取消／重整，保留修改資料；事件模擬確認後寫入 7 筆範例與 32.5 匯率 | 無 |
| CR-06 | 未通過 | 重播實際 App 的儲存副作用，第二次將 `[null]` 寫成 7 筆範例 | 保護須能承受 StrictMode 重播，加入回歸測試 |
| CR-07 | 未通過 | 實際瀏覽器及表單到 App 事件模擬皆確認清除後仍保留 12 月 | 明確清除欄位並驗證重新載入與週期切換 |

- **新增問題：** CR-06、CR-07，完整重現與驗收見第 5 段。
- **測試指令與實際結果：** `npm run build` 通過（無型別錯誤或建置警告）；`npm test` 通過（3 suites、9 tests、9 pass）；`git diff --check` 通過。補充 `node /tmp/ai-tools-subscription-review-20261114.mjs` 通過全部證據斷言，包含重現上述兩個缺陷；測試通過代表成功證實行為，並非缺陷已解決。
- **補充證據：** 臨時測試腳本 `/tmp/ai-tools-subscription-review-20261114.mjs`；瀏覽器截圖 `/tmp/ai-tools-subscription-review-20261114.jpg`（清除後重開表單仍顯示 12 月）。兩者為本機臨時檔，可能被系統清理，重現步驟已保留於本文件。
- **驗證限制：** Hook／事件模擬不是完整瀏覽器生命週期測試；瀏覽器使用獨立連接埠的範例資料，未操作原有來源的真實資料；未驗證手機／完整鍵盤／匯率 API。既有 9 項測試不涵蓋副作用重播或表單清除欄位，部分測試名稱提及非有限數字／短月份，但測試內容沒有直接覆蓋這些邊界案例，請依新增問題補強實際案例。
- **下一輪交接：** Gemini 先修 CR-06，再修 CR-07，新增回歸測試後重新執行建置與測試。請在上方 Gemini 區附加「第 2 輪 Gemini 回覆」，逐項回覆 CR-06、CR-07 與關聯 CR-01、CR-03，其餘項目註明是否受影響；保留第 1 輪記錄，不自行宣告 Codex 通過。

### 第 2 輪 Codex 複審（已完成，通過）

- **複審時間（Asia/Taipei）：** 2026-11-14 19:53。
- **對應 Gemini 回覆／審查版本：** 第 2 輪 Gemini 回覆；分支 `fix-code-review`，HEAD `03858a7aac3baf6f6dae825844d7ba4feee492e8` 加本機未提交變更，包含未追蹤的 `src/utils/subscriptionHelpers.ts`。已確認第一輪修正存在此 commit；尚未提交的第二輪修改不包含在該 commit 內。
- **整體結論：** 本次追蹤問題在已驗證範圍內通過，沒有新增的需修正問題。保留第一輪結論作為歷史，不應再依第一輪文字誤判目前仍待修正。

| 問題編號 | 結論 | 實際驗證與證據 | 需要 Gemini 再修正的內容 |
| --- | --- | --- | --- |
| CR-01 | 通過 | 11 項測試包含逐筆驗證與 NaN／Infinity；整合模擬再次匯入 null、空物件、無效分類，均保留合法原資料；損壞值保護另見 CR-06 | 無 |
| CR-02 | 通過（模擬範圍） | 再次模擬 App 初始化的 localStorage getter 拋錯與寫入配額失敗，無未處理例外並建立警告區塊；安全儲存測試通過 | 無 |
| CR-03 | 通過 | 日期與月均計算測試維持通過；新增短月份測試；與 CR-07 的實際表單清除／週期切換驗證一致 | 無 |
| CR-04 | 通過 | 本輪未變更 KPI／README 文字，瀏覽器仍顯示「每月平均支出（含年繳攤提）」 | 無 |
| CR-05 | 通過（上述範圍） | 本輪 App 事件模擬：開啟／取消保留資料，確認後才寫入 7 筆範例與匯率 32.5；確認視窗本體未變更 | 無 |
| CR-06 | 通過（App 副作用模擬） | 實際 App 載入 `[null]`，重播儲存副作用後仍保留原值；切換幣別／匯率、重掛 App、開啟／取消重置均保持保護；確認重置才寫回 | 無 |
| CR-07 | 通過 | 實際表單變更／提交到 App 更新與 JSON 儲存，確認 billingMonth 已移除；瀏覽器清除 12 月後重整，清單顯示未指定月份；重開表單及年繳→月繳→年繳也不回帶月份，儲存與重整後仍正確 | 無 |

- **測試指令與實際結果：**
  - `npm run build`：通過，無 TypeScript 錯誤及建置警告。
  - `npm test`：通過，3 suites、11 tests、11 pass、0 fail。
  - `node /tmp/ai-tools-subscription-review-round2-20261114.mjs`：實際 App／表單的補充事件與副作用模擬斷言全部通過，涵蓋 CR-01、02、05、06、07。這是 Codex 的臨時檢查程式，不屬於專案持續執行的測試套件。
  - `git diff --check`：通過。
- **瀏覽器證據：** `http://127.0.0.1:5187/` 的獨立測試來源，沿用前輪修改的範例資料。清除月份並重整後的截圖：`/tmp/ai-tools-subscription-review-round2-20261114.jpg`；臨時腳本及截圖可能被系統清理，必要重現步驟已保留在本文件。
- **驗證限制：** Hook 事件模擬未涵蓋完整 React StrictMode 生命週期；未對真實瀏覽器儲存注入損壞值。瀏覽器互動涵蓋 CR-07 與相關顯示，不包含檔案選取器、手機、完整鍵盤操作、匯率 API 或真實配額／權限錯誤；不將這些範圍宣稱通過。
- **本輪修改檔案：** Codex 僅更新 `docs/code_review_handoff.md`；未修改產品程式、測試或 Git 提交。
- **下一步：** 將本輪通過結果交給使用者。若要保存第二輪進度，後續可依使用者授權建立本機 commit，務必包含新增的 `src/utils/subscriptionHelpers.ts`。本次未執行 commit、Push、Merge 或部署；無需再交由 Gemini 修正已驗收的七項問題。

協作方式：目前透過本文件與使用者通知交接，沒有建立自動通知或直接對話通道。本輪審查已通過；若未來發現新問題，保留既有歷史並以新編號及新的 Gemini／Codex 輪次記錄。
