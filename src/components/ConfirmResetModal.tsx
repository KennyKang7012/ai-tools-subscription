import { AlertTriangle, Download, X } from 'lucide-react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  itemCount: number;
  onCancel: () => void;
  onExportBeforeReset: () => void;
  onConfirmReset: () => void;
}

export function ConfirmResetModal({
  isOpen,
  itemCount,
  onCancel,
  onExportBeforeReset,
  onConfirmReset,
}: ConfirmResetModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-reset-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-500/35 bg-[#0D1322] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="confirm-reset-title" className="text-base font-bold text-white">
                確認重置為範例資料？
              </h3>
              <p className="text-xs text-slate-400">此操作將會覆寫現有設定</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="關閉確認視窗"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            按下確認後，系統將以 7 筆預設展示訂閱取代您目前的{' '}
            <strong className="font-mono-nums text-white">{itemCount}</strong>{' '}
            筆訂閱清單，並將匯率重設為{' '}
            <strong className="font-mono-nums text-cyan-300">1 USD = 32.5 TWD</strong>。
          </p>
          <p className="text-slate-400">
            建議在重置前先匯出 JSON 備份，以免遺失自訂項目。
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExportBeforeReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            先匯出備份
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirmReset}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              確認重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
