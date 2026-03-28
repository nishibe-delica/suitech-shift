import { useState } from "react";
import type { YearData, HolidayPeriod } from "../types";
import { formatDateStr, parseDateStr } from "../utils/calendar";

interface SettingsModalProps {
  yearData: YearData;
  onSave: (updated: YearData) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

type TabId = "special" | "company" | "marathon";

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInRange(start: string, end: string): Date[] {
  const days: Date[] = [];
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export default function SettingsModal({
  yearData,
  onSave,
  onClose,
  onExport,
  onImport,
}: SettingsModalProps) {
  const [tab, setTab] = useState<TabId>("special");
  const [draft, setDraft] = useState<YearData>({ ...yearData, holidayPeriods: yearData.holidayPeriods.map(p => ({ ...p, noDutyDates: [...p.noDutyDates] })) });

  // 特別休暇追加フォーム
  const [newPeriodLabel, setNewPeriodLabel] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");

  // 全社出勤日フォーム
  const [newWorkDay, setNewWorkDay] = useState("");

  function addHolidayPeriod() {
    if (!newPeriodStart || !newPeriodEnd || !newPeriodLabel) return;
    if (newPeriodEnd < newPeriodStart) return;
    const id = `period-${Date.now()}`;
    setDraft((d) => ({
      ...d,
      holidayPeriods: [
        ...d.holidayPeriods,
        { id, label: newPeriodLabel, start: newPeriodStart, end: newPeriodEnd, noDutyDates: [] },
      ],
    }));
    setNewPeriodLabel("");
    setNewPeriodStart("");
    setNewPeriodEnd("");
  }

  function removeHolidayPeriod(id: string) {
    setDraft((d) => ({
      ...d,
      holidayPeriods: d.holidayPeriods.filter((p) => p.id !== id),
    }));
  }

  function toggleNoDuty(periodId: string, date: string) {
    setDraft((d) => ({
      ...d,
      holidayPeriods: d.holidayPeriods.map((p): HolidayPeriod => {
        if (p.id !== periodId) return p;
        const isNoDuty = p.noDutyDates.includes(date);
        return {
          ...p,
          noDutyDates: isNoDuty
            ? p.noDutyDates.filter((x) => x !== date)
            : [...p.noDutyDates, date].sort(),
        };
      }),
    }));
  }

  function addWorkDay() {
    if (!newWorkDay || draft.companyWorkDays.includes(newWorkDay)) return;
    setDraft((d) => ({
      ...d,
      companyWorkDays: [...d.companyWorkDays, newWorkDay].sort(),
    }));
    setNewWorkDay("");
  }

  function removeWorkDay(date: string) {
    setDraft((d) => ({
      ...d,
      companyWorkDays: d.companyWorkDays.filter((x) => x !== date),
    }));
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "special", label: "特別休暇" },
    { id: "company", label: "全社出勤日" },
    { id: "marathon", label: "マラソン" },
  ];

  const holidayDateSet = new Set(draft.holidays.map((h) => h.date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">設定</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* タブ */}
        <div className="flex gap-3 px-8 py-5 bg-gray-50 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-6 py-3.5 text-base font-semibold rounded-xl transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-brand-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 shadow-sm hover:bg-brand-50 hover:border-brand-400 hover:text-brand-700"
              }`}
            >
              {t.id === "special" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              )}
              {t.id === "company" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              )}
              {t.id === "marathon" && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              )}
              {t.label}
              {t.id === "special" && draft.holidayPeriods.length > 0 && (
                <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${
                  tab === t.id ? "bg-white/20 text-white" : "bg-brand-100 text-brand-600"
                }`}>
                  {draft.holidayPeriods.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-5">

          {/* ━━━ 特別休暇タブ ━━━ */}
          {tab === "special" && (
            <>
              {/* 追加フォーム */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <p className="text-sm font-semibold text-gray-600">新しい期間を追加</p>
                <div>
                  <label className="text-sm text-gray-500 mb-1.5 block">名称</label>
                  <input
                    type="text"
                    value={newPeriodLabel}
                    onChange={(e) => setNewPeriodLabel(e.target.value)}
                    placeholder="例: GW、夏季休暇、年末年始"
                    className="w-full text-base border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-500 mb-1.5 block">開始日</label>
                    <input
                      type="date"
                      value={newPeriodStart}
                      onChange={(e) => setNewPeriodStart(e.target.value)}
                      className="w-full text-base border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1.5 block">終了日</label>
                    <input
                      type="date"
                      value={newPeriodEnd}
                      onChange={(e) => setNewPeriodEnd(e.target.value)}
                      className="w-full text-base border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                </div>
                <button
                  onClick={addHolidayPeriod}
                  disabled={!newPeriodStart || !newPeriodEnd || !newPeriodLabel || newPeriodEnd < newPeriodStart}
                  className="w-full py-3 bg-brand-600 text-white text-base font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  追加
                </button>
              </div>

              {/* 登録済み期間一覧 */}
              {draft.holidayPeriods.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">特別休暇期間が設定されていません</p>
              ) : (
                <div className="space-y-3">
                  {draft.holidayPeriods.map((period) => {
                    const days = getDaysInRange(period.start, period.end);
                    const noDutySet = new Set(period.noDutyDates);

                    // 統計
                    let dutyDayCount = 0;
                    let extraWeekdays = 0;
                    for (const d of days) {
                      const dow = d.getDay();
                      const dateStr = formatDateStr(d);
                      if (dow === 0) continue;
                      if (!noDutySet.has(dateStr)) dutyDayCount++;
                      if (dow !== 6 && !holidayDateSet.has(dateStr)) extraWeekdays++;
                    }

                    return (
                      <div key={period.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* 期間ヘッダー */}
                        <div className="flex items-center justify-between bg-blue-50 px-5 py-3">
                          <div>
                            <span className="text-base font-semibold text-gray-700">{period.label}</span>
                            <span className="text-sm text-gray-500 ml-3">
                              {period.start.replace(/-/g, "/")} 〜 {period.end.replace(/-/g, "/")}
                            </span>
                          </div>
                          <button
                            onClick={() => removeHolidayPeriod(period.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* 日別リスト */}
                        <div className="divide-y divide-gray-50">
                          {days.map((d) => {
                            const dateStr = formatDateStr(d);
                            const dow = d.getDay();
                            const isSunday = dow === 0;
                            const isSaturday = dow === 6;
                            const holidayName = draft.holidays.find((h) => h.date === dateStr)?.name;
                            const isWeekday = !isSunday && !isSaturday && !holidayName;
                            const isNoDuty = noDutySet.has(dateStr);

                            return (
                              <div
                                key={dateStr}
                                className={`flex items-center justify-between px-5 py-2.5 ${isSunday ? "opacity-40 bg-gray-50/50" : ""}`}
                              >
                                {/* 日付・曜日 */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`text-base font-semibold w-6 shrink-0 ${
                                      isSunday
                                        ? "text-gray-400"
                                        : isSaturday
                                          ? "text-blue-600"
                                          : holidayName
                                            ? "text-red-500"
                                            : "text-gray-700"
                                    }`}
                                  >
                                    {d.getDate()}
                                  </span>
                                  <span
                                    className={`text-sm w-5 shrink-0 font-medium ${
                                      isSunday ? "text-gray-400" : isSaturday ? "text-blue-500" : "text-gray-500"
                                    }`}
                                  >
                                    {DOW_LABELS[dow]}
                                  </span>
                                  {holidayName && (
                                    <span className="text-xs text-red-400 bg-red-50 px-2 py-1 rounded-lg truncate">
                                      {holidayName}
                                    </span>
                                  )}
                                  {isWeekday && (
                                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                                      全員+1日
                                    </span>
                                  )}
                                </div>

                                {/* トグル */}
                                {isSunday ? (
                                  <span className="text-xs text-gray-400 shrink-0">当番なし</span>
                                ) : (
                                  <button
                                    onClick={() => toggleNoDuty(period.id, dateStr)}
                                    className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                      isNoDuty
                                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        : "bg-brand-100 text-brand-700 hover:bg-brand-200"
                                    }`}
                                  >
                                    {isNoDuty ? "担当なし" : "担当あり"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* 期間サマリー */}
                        <div className="bg-gray-50 px-5 py-3 flex items-center gap-5 text-sm text-gray-600 border-t border-gray-100">
                          <span>
                            当番日:{" "}
                            <strong className="text-gray-800">{dutyDayCount}日</strong>
                          </span>
                          <span>
                            追加平日休み:{" "}
                            <strong className="text-blue-600">+{extraWeekdays}日</strong>
                          </span>
                          {dutyDayCount > 0 && (
                            <span className="ml-auto text-gray-400">
                              1人あたり約 {(dutyDayCount / 4).toFixed(1)}日
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ━━━ 全社出勤日タブ ━━━ */}
          {tab === "company" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                特別休暇で増えた平日休みを相殺するため、土曜出勤日（全員出勤）を設定します。
              </p>
              <div className="bg-gray-50 rounded-xl p-5 flex gap-3">
                <input
                  type="date"
                  value={newWorkDay}
                  onChange={(e) => setNewWorkDay(e.target.value)}
                  className="flex-1 text-base border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
                <button
                  onClick={addWorkDay}
                  disabled={!newWorkDay}
                  className="px-6 py-3 bg-brand-600 text-white text-base font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  追加
                </button>
              </div>
              {draft.companyWorkDays.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">全社出勤日は設定されていません</p>
              ) : (
                <div className="space-y-2">
                  {draft.companyWorkDays.map((date) => (
                    <div
                      key={date}
                      className="flex items-center justify-between bg-amber-50 rounded-xl px-5 py-3"
                    >
                      <span className="text-base text-gray-700">{date.replace(/-/g, "/")}</span>
                      <button
                        onClick={() => removeWorkDay(date)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ━━━ マラソンタブ ━━━ */}
          {tab === "marathon" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                揖斐川マラソンの日程を設定します。三木・西部・山田が出勤します（谷脇は休み）。
              </p>
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block">マラソン日</label>
                <input
                  type="date"
                  value={draft.marathonDate ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, marathonDate: e.target.value || null }))
                  }
                  className="w-full text-base border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              {draft.marathonDate && (
                <div className="bg-orange-50 rounded-xl p-5">
                  <p className="text-base text-gray-700">
                    <span className="font-semibold">{draft.marathonDate.replace(/-/g, "/")}</span>
                    に設定されています
                  </p>
                  <p className="text-sm text-gray-500 mt-2">出勤: 三木・西部・山田 / 休み: 谷脇</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              バックアップ保存
            </button>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              バックアップ読込
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { onImport(file); onClose(); }
                }}
              />
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={() => { onSave(draft); onClose(); }}
              className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-md transition-all cursor-pointer"
            >
              保存して再割り振り
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
