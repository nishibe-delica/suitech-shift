import type { Assignment, Member, YearData } from "../types";
import { getHolidayName, parseDateStr } from "../utils/calendar";
import { getDutyDays } from "../utils/assignment";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

interface YearlyViewProps {
  assignments: Assignment[];
  members: Member[];
  yearData: YearData;
}

export default function YearlyView({ assignments, members, yearData }: YearlyViewProps) {
  const activeMembers = members.filter((m) => m.active);

  const dutyDaySet = new Set(getDutyDays(yearData));
  const allDates = new Set([
    ...dutyDaySet,
    ...(yearData.marathonDate ? [yearData.marathonDate] : []),
    ...yearData.companyWorkDays,
  ]);

  // 4月〜3月の12ヶ月
  const months = [
    ...Array.from({ length: 9 }, (_, i) => ({ year: yearData.fiscalYear, month: i + 3 })),
    ...Array.from({ length: 3 }, (_, i) => ({ year: yearData.fiscalYear + 1, month: i })),
  ];

  return (
    <div className="w-full">
      {/* 画面見出し */}
      <div className="print:hidden mb-6 flex items-baseline gap-3">
        <h2 className="text-2xl font-bold text-gray-800">{yearData.fiscalYear}年度 当番一覧</h2>
        <span className="text-sm text-gray-400">
          {yearData.startDate.replace(/-/g, "/")} 〜 {yearData.endDate.replace(/-/g, "/")}
        </span>
      </div>

      {/* 印刷タイトル */}
      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-bold">
          スイテック 休日当番シフト — {yearData.fiscalYear}年度 年間当番一覧
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {yearData.startDate.replace(/-/g, "/")} 〜 {yearData.endDate.replace(/-/g, "/")}
        </p>
      </div>

      {/* 月カードグリッド — 印刷時は横向き4列 */}
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-4 print:gap-2">
        {months.map(({ year, month }) => {
          const monthDates = [...allDates]
            .filter((d) => {
              const date = parseDateStr(d);
              return date.getFullYear() === year && date.getMonth() === month;
            })
            .sort();

          if (monthDates.length === 0) {
            return (
              <div key={`${year}-${month}`} className="rounded-2xl border border-gray-200 overflow-hidden print:rounded-md">
                <div className="bg-brand-600 px-4 py-3 print:px-2 print:py-1.5">
                  <span className="text-white font-bold text-base print:text-xs">{year}年{month + 1}月</span>
                </div>
                <div className="px-4 py-6 text-center text-sm text-gray-400 bg-white print:py-2 print:text-xs">
                  当番日なし
                </div>
              </div>
            );
          }

          return (
            <div
              key={`${year}-${month}`}
              className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:rounded-md print:shadow-none"
            >
              {/* 月ヘッダー */}
              <div className="bg-brand-600 px-4 py-3 print:px-2 print:py-1 flex items-center justify-between">
                <span className="text-white font-bold text-base print:text-xs">{year}年{month + 1}月</span>
                <span className="text-white/60 text-sm print:text-xs">{monthDates.length}日</span>
              </div>

              {/* 当番日リスト */}
              <div className="bg-white divide-y divide-gray-100">
                {monthDates.map((dateStr, rowIdx) => {
                  const date = parseDateStr(dateStr);
                  const dow = date.getDay();
                  const holidayName = getHolidayName(date, yearData.holidays);
                  const isMarathon = yearData.marathonDate === dateStr;
                  const isCompanyWork = yearData.companyWorkDays.includes(dateStr);
                  const periodLabel =
                    yearData.holidayPeriods.find(
                      (p) => dateStr >= p.start && dateStr <= p.end
                    )?.label ?? null;

                  let typeLabel = "";
                  if (isMarathon) typeLabel = "マラソン";
                  else if (isCompanyWork) typeLabel = "全社出勤";
                  else if (periodLabel) typeLabel = periodLabel;
                  else if (holidayName) typeLabel = holidayName;

                  const dayAssignments = assignments.filter((a) => a.date === dateStr);
                  const assignedMembers: Member[] = isCompanyWork
                    ? activeMembers
                    : (dayAssignments
                        .map((a) => members.find((m) => m.id === a.memberId))
                        .filter(Boolean) as Member[]);

                  return (
                    <div
                      key={dateStr}
                      className={`flex items-center justify-between px-4 py-2.5 print:px-2 print:py-0.5 ${
                        rowIdx % 2 === 1 ? "bg-gray-50/60" : "bg-white"
                      }`}
                    >
                      {/* 左: 日付 */}
                      <div className="flex items-center gap-2 print:gap-1 min-w-0">
                        <span className="text-sm font-bold text-gray-800 tabular-nums w-10 shrink-0 print:text-xs print:w-8">
                          {month + 1}/{date.getDate()}
                        </span>
                        <span
                          className={`text-xs font-medium w-4 shrink-0 print:w-3 ${
                            dow === 6 ? "text-blue-500" : dow === 0 ? "text-red-400" : "text-gray-400"
                          }`}
                        >
                          {DOW[dow]}
                        </span>
                        {typeLabel && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate print:hidden">
                            {typeLabel}
                          </span>
                        )}
                      </div>

                      {/* 右: 担当者バッジ */}
                      <div className="flex items-center gap-1 shrink-0 ml-2 print:ml-0.5">
                        {assignedMembers.length > 0 ? (
                          assignedMembers.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex px-2 py-0.5 rounded text-xs font-semibold text-gray-700 print:px-1 print:py-0 print:text-[9px]"
                              style={{ backgroundColor: m.color }}
                            >
                              {m.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-amber-500 font-medium print:text-[9px]">未割当</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
