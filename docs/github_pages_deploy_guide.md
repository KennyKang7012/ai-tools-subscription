# GitHub Pages 自動化部署教學與備忘指南

本文件說明如何將「訂閱戰情室（`ai-tools-subscription`）」純前端 Vite + React 專案免費部署至 GitHub Pages，並記錄本專案套用的設定原理與日常維護流程。

---

## 1. 為什麼這個專案適合 GitHub Pages？

- **純靜態產物**：執行 `npm run build` 後，所有程式會打包為 `dist/` 目錄內的靜態 HTML、CSS、JS 與 SVG 檔案，不需後端伺服器或資料庫。
- **資料儲存於瀏覽器**：所有訂閱清單與匯率設定皆存放在使用者端 `localStorage`，並透過 HTTPS 呼叫公開匯率 API（離線時自動退回手動輸入）。

---

## 2. 專案內已完成的設定與原理解析

### (1) 相對路徑設定：`vite.config.ts` 與 `index.html`

GitHub Pages 的專案網站預設網址為子路徑形式：
`https://<帳號>.github.io/<倉庫名稱>/`（本專案為 `https://kennykang7012.github.io/ai-tools-subscription/`）。

如果打包時使用預設的根路徑 `/`（例如 `/assets/index.js` 或 `/favicon.svg`），瀏覽器會錯誤地向 `https://kennykang7012.github.io/assets/...` 請求檔案而發生 **404 錯誤**。

因此專案中已調整兩處：
1. `vite.config.ts` 加入 `base: './'`：讓 Vite 打包出相對路徑資源（`./assets/...`），同時保留本機 `npm run dev` 在 `http://localhost:5173/` 的開發體驗。
2. `index.html` 將圖示改為 `href="./favicon.svg"`：確保網站圖示在子路徑下也能正確載入。

### (2) GitHub Actions 自動部署流程：`.github/workflows/deploy.yml`

每當程式碼推送到 `main` 分支（或在 GitHub 網頁手動觸發 `workflow_dispatch`），GitHub Actions 會自動執行以下兩個階段：

| 階段 | 執行動作 | 說明 |
| --- | --- | --- |
| **1. `build`** | `npm ci` → `npm test` → `npm run build` | 安裝套件、先跑過 11 項單元與回歸測試，通過後才建置 `dist/` 並上傳為 Pages Artifact。 |
| **2. `deploy`** | `actions/deploy-pages@v4` | 將建置好的 `dist/` 發布到 GitHub Pages 正式環境。 |

---

## 3. 第一次啟用 GitHub Pages 的設定步驟（只需做一次）

設定檔推送到 GitHub 的 `main` 分支後，請到倉庫網頁完成以下開啟步驟：

1. 開啟 GitHub 倉庫頁面：`https://github.com/KennyKang7012/ai-tools-subscription`
2. 點擊上方分頁 **Settings**（設定）。
3. 在左側選單找到 **Pages**。
4. 在 **Build and deployment** 區塊的 **Source** 下拉選單中，選擇 **GitHub Actions**（注意：不要選 `Deploy from a branch`）。
5. 前往上方 **Actions** 分頁，即可看到 `Deploy to GitHub Pages` 正在執行（若尚未觸發，可點擊右側 **Run workflow** 手動執行一次）。
6. 等待 `build` 與 `deploy` 兩個步驟都顯示綠色勾勾（約 1 分鐘），頁面上就會顯示正式網址：
   - `https://kennykang7012.github.io/ai-tools-subscription/`

---

## 4. 如何將本機資料搬移到線上版？

瀏覽器的 `localStorage` 是依照「網域（Origin）」隔離儲存的：
- 本機開發環境：`http://localhost:5173`
- GitHub Pages 線上版：`https://kennykang7012.github.io`

因此第一次打開線上版時，會看到預設的 7 筆範例資料。您可以用內建備份功能 10 秒完成搬移：
1. 在本機版右上角點擊 **「匯出」**，下載 `.json` 備份檔。
2. 開啟 GitHub Pages 線上版，點擊右上角 **「匯入」** 並選取剛剛下載的 `.json` 檔案即可同步。

---

## 5. 日常更新與維護流程

之後只要您在本機修改完程式並想更新線上網站，只需：

```bash
# 1. 本機確認測試與建置通過
npm test && npm run build

# 2. 提交並推送到 GitHub main 分支
git add .
git commit -m "feat: 更新說明"
git push origin main
```

推送完成後，GitHub Actions 會在約 1 分鐘內自動重新測試、打包並更新線上網站。

---

## 6. 常見問題排除（Troubleshooting）

- **頁面空白或資源 404**：檢查 `vite.config.ts` 的 `base` 是否為 `'./'`（或 `'/ai-tools-subscription/'`），且 `index.html` 未使用 `/favicon.svg` 這類開頭斜線的絕對路徑。
- **Actions 顯示 `Resource not accessible by integration`**：確認 `.github/workflows/deploy.yml` 內已設定 `pages: write` 與 `id-token: write` 權限，且倉庫 **Settings → Pages → Source** 已改為 **GitHub Actions**。
- **更新後畫面沒變**：瀏覽器可能快取了舊版靜態檔，請按 `Cmd + Shift + R`（macOS）或 `Ctrl + Shift + R`（Windows）強制重新整理。
