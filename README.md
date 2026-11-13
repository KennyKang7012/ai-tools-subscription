# 訂閱戰情室 | Subscription War-Room Dashboard

一套專為個人創作者與開發者設計的「戰情室」風格訂閱費用追蹤儀表板，整合 **AI 工具**、**文章寫作平台**、**影音娛樂** 與 **雲端服務**，支援 **美金（USD）與台幣（TWD）混合計費** 的即時匯率換算、年繳攤提與省錢模擬。

## 功能特色

- **USD / TWD 雙幣別戰情換算**：支援手動即時調整 `1 USD = __ TWD` 匯率，或一鍵透過公開匯率 API 更新；可隨時切換「台幣總覽」或「美金總覽」。
- **核心 KPI 矩陣**：即時統計本月實付總支出（拆解 USD 與 TWD 原幣小計）、年度支出推估（`×12`）、AI 工具支出佔比與最高單項。
- **視覺化戰情分析**：
  - 互動式 **SVG 分類佔比環圈圖** 與 USD / TWD 計價比例條。
  - **支出排行 Top 5** 水平長條圖。
  - **扣款雷達（Upcoming）** 依每月扣款日自動排序並提示近期扣款倒數。
- **省錢模擬（What-If Analysis）**：每筆訂閱皆提供「啟用／暫停」撥動開關，點擊即可即時試算取消特定訂閱後的月省／年省金額。
- **開箱即用與快速新增**：內建常見 AI 與影音寫作範例清單，新增彈窗支援 12 款常用工具一鍵帶入。
- **本地持久化與備份**：所有資料與匯率設定自動儲存於瀏覽器 `localStorage`，並提供 **JSON 匯出／匯入** 與 **範例重置** 功能。

## 技術棧

- **框架**：React 19 + TypeScript + Vite 6
- **樣式**：Tailwind CSS v4（暗黑戰情室主題 + `JetBrains Mono` 等寬數字）
- **圖示**：Lucide React

## 快速開始

```bash
# 1. 安裝相依套件
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 型別檢查與正式建置
npm run build
```

啟動後請於瀏覽器開啟 `http://localhost:5173/`。

## 專案結構

```text
├── docs/
│   └── implementation_plan.md   # 實作計畫與架構設計文件
├── src/
│   ├── components/
│   │   ├── HeaderBar.tsx        # 頂部戰情控制列（匯率、幣別切換、匯出匯入）
│   │   ├── KpiGrid.tsx          # 四大核心 KPI 指標卡
│   │   ├── AnalyticsSection.tsx # 分類環圈圖、Top 5 排行、扣款雷達
│   │   ├── SubscriptionTable.tsx# 訂閱清單（篩選、搜尋、排序、啟用開關）
│   │   └── SubscriptionModal.tsx# 新增／編輯彈窗與快速帶入模板
│   ├── data/
│   │   └── presets.ts           # 預設展示清單與常見工具快速模板
│   ├── types/
│   │   └── subscription.ts      # 訂閱資料模型與分類色票定義
│   ├── utils/
│   │   └── currency.ts          # 雙幣別換算、年繳攤提與扣款日計算
│   ├── App.tsx                  # 主狀態管理與 localStorage 持久化
│   ├── index.css                # Tailwind v4 與戰情室背景格線樣式
│   └── main.tsx                 # React 進入點
├── AGENTS.md                    # AI 協作代理開發規範與架構指引
└── README.md                    # 專案說明文件
```
