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
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">設定</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
                tab === t.id
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {t.id === "special" && draft.holidayPeriods.length > 0 && (
                <span className="ml-1.5 text-xs bg-brand-100 text-brand-600 rounded-full px-1.5 py-0.5">
                  {draft.holidayPeriods.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">

          {/* ━━━ 特別休暇タブ ━━━ */}
          {tab === "special" && (
            <>
              {/* 追加フォーム */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">新しい期間を追加</p>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">名称</label>
                  <input
                    type="text"
                    value={newPeriodLabel}
                    onChange={(e) => setNewPeriodLabel(e.target.value)}
                    placeholder="例: GW、夏季休暇、年末年始"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">開始日</label>
                    <input
                      type="date"
                      value={newPeriodStart}
                      onChange={(e) => setNewPeriodStart(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">終了日</label>
                    <input
                      type="date"
                      value={newPeriodEnd}
                      onChange={(e) => setNewPeriodEnd(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                </div>
                <button
                  onClick={addHolidayPeriod}
                  disabled={!newPeriodStart || !newPeriodEnd || !newPeriodLabel || newPeriodEnd < newPeriodStart}
                  className="w-full py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                        <div className="flex items-center justify-between bg-blue-50 px-4 py-2.5">
                          <div>
                            <span className="text-sm font-semibold text-gray-700">{period.label}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {period.start.replace(/-/g, "/")} 〜 {period.end.replace(/-/g, "/")}
                            </span>
                          </div>
                          <button
                            onClick={() => removeHolidayPeriod(period.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
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
                                className={`flex items-center justify-between px-4 py-1.5 ${isSunday ? "opacity-40 bg-gray-50/50" : ""}`}
                              >
                                {/* 日付・曜日 */}
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`text-sm font-medium w-5 shrink-0 ${
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
                                    className={`text-xs w-4 shrink-0 font-medium ${
                                      isSunday ? "text-gray-400" : isSaturday ? "text-blue-500" : "text-gray-500"
                                    }`}
                                  >
                                    {DOW_LABELS[dow]}
                                  </span>
                                  {holidayName && (
                                    <span className="text-[10px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded truncate">
                                      {holidayName}
                                    </span>
                                  )}
                                  {isWeekday && (
                                    <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                      全員+1日
                                    </span>
                                  )}
                                </div>

                                {/* トグル */}
                                {isSunday ? (
                                  <span className="text-[10px] text-gray-400 shrink-0">当番なし</span>
                                ) : (
                                  <button
                                    onClick={() => toggleNoDuty(period.id, dateStr)}
                                    className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
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
                        <div className="bg-gray-50 px-4 py-2 flex items-center gap-4 text-xs text-gray-600 border-t border-gray-100">
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
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                特別休暇で増えた平日休みを相殺するため、土曜出勤日（全員出勤）を設定します。
              </p>
              <div className="bg-gray-50 rounded-xl p-4 flex gap-2">
                <input
                  type="date"
                  value={newWorkDay}
                  onChange={(e) => setNewWorkDay(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
                <button
                  onClick={addWorkDay}
                  disabled={!newWorkDay}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  追加
                </button>
              </div>
              {draft.companyWorkDays.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">全社出勤日は設定されていません</p>
              ) : (
                <div className="space-y-2">
                  {draft.companyWorkDays.map((date) => (
                    <div
                      key={date}
                      className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-gray-700">{date.replace(/-/g, "/")}</span>
                      <button
                        onClick={() => removeWorkDay(date)}
                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                揖斐川マラソンの日程を設定します。三木・西部・山田が出勤します（谷脇は休み）。
              </p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">マラソン日</label>
                <input
                  type="date"
                  value={draft.marathonDate ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, marathonDate: e.target.value || null }))
                  }
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              {draft.marathonDate && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{draft.marathonDate.replace(/-/g, "/")}</span>
                    に設定されています
                  </p>
                  <p className="text-xs text-gray-500 mt-1">出勤: 三木・西部・山田 / 休み: 谷脇</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              JSON保存
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              JSON読込
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
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={() => { onSave(draft); onClose(); }}
              className="px-4 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors cursor-pointer"
            >
              保存して再割り振り
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
