import type { YearData } from "../types";
import { SUPPORTED_YEARS } from "../data/yearDefaults";

interface HeaderProps {
  yearData: YearData;
  onAutoAssign: () => void;
  hasAssignments: boolean;
  onOpenSettings: () => void;
  onPrint: () => void;
  onYearChange: (year: number) => void;
  isAdmin: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  cloudStatus: "idle" | "loading" | "saved";
}

export default function Header({
  yearData,
  onAutoAssign,
  hasAssignments,
  onOpenSettings,
  onPrint,
  onYearChange,
  isAdmin,
  onLoginClick,
  onLogout,
  cloudStatus,
}: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 shadow-lg print:hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* タイトル + 年度切替 */}
          <div className="flex items-center gap-5 min-w-0">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                休日当番シフト管理
              </h1>
              <p className="text-white/70 text-sm mt-0.5 hidden sm:block font-medium">
                スイテック &nbsp;·&nbsp; {yearData.startDate.slice(0, 7).replace("-", "/")} 〜 {yearData.endDate.slice(0, 7).replace("-", "/")}
              </p>
            </div>

            {/* 年度セレクター（ドロップダウン） */}
            <div className="shrink-0">
              <select
                value={yearData.fiscalYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-white/15 text-white font-bold text-sm rounded-xl px-4 py-2 border border-white/20 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer appearance-none pr-8 transition-all"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "16px" }}
              >
                {SUPPORTED_YEARS.map((year) => (
                  <option key={year} value={year} className="bg-brand-700 text-white">
                    {year}年度
                  </option>
                ))}
              </select>
            </div>
          </div>


          {/* ボタン群 */}
          <div className="flex items-center gap-3 shrink-0">
            {/* クラウド保存ステータス（管理者のみ） */}
            {isAdmin && cloudStatus !== "idle" && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                cloudStatus === "loading"
                  ? "bg-white/20 text-white/80"
                  : "bg-green-400/30 text-green-100"
              }`}>
                {cloudStatus === "loading" ? "保存中..." : "✓ 保存済み"}
              </span>
            )}

            {/* 管理者ログイン/ログアウト */}
            {isAdmin ? (
              <button
                onClick={onLogout}
                title="管理者ログアウト"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-400/25 text-green-100 font-medium text-xs rounded-full hover:bg-green-400/40 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                管理者
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                title="管理者ログイン"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white/60 font-medium text-xs rounded-full hover:bg-white/20 hover:text-white transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                閲覧中
              </button>
            )}

            {/* 印刷ボタン */}
            <button
              onClick={onPrint}
              title="印刷"
              className="w-11 h-11 flex items-center justify-center bg-white/15 text-white rounded-full hover:bg-white/25 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
            </button>

            {/* 設定ボタン（管理者のみ） */}
            {isAdmin && <button
              onClick={onOpenSettings}
              title="設定"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-medium text-sm rounded-full hover:bg-white/25 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">設定</span>
            </button>}

            {/* 自動割り振りボタン（管理者のみ） */}
            {isAdmin && <button
              onClick={onAutoAssign}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-bold text-sm rounded-full shadow-md hover:shadow-lg hover:bg-brand-50 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="hidden sm:inline">
                {hasAssignments ? "再割り振り" : "自動割り振り"}
              </span>
            </button>}
          </div>
        </div>
      </div>
    </header>
  );
}
