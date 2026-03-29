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

  // 当番日・マラソン・全社出勤をまとめて収集
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
      {/* 印刷時タイトル */}
      <div className="hidden print:block mb-4">
        <h1 className="text-lg font-bold">
          スイテック 休日当番シフト — {yearData.fiscalYear}年度 年間一覧
        </h1>
      </div>

      <div className="space-y-8 print:space-y-4">
        {months.map(({ year, month }) => {
          // その月の対象日を抽出・昇順ソート
          const monthDates = [...allDates]
            .filter((d) => {
              const date = parseDateStr(d);
              return date.getFullYear() === year && date.getMonth() === month;
            })
            .sort();

          if (monthDates.length === 0) return null;

          return (
            <div key={`${year}-${month}`} className="print:break-inside-avoid">
              <h3 className="text-base font-bold text-brand-700 border-b-2 border-brand-200 pb-1 mb-2">
                {year}年{month + 1}月
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                    <th className="py-1 pr-6 font-medium w-32">日付</th>
                    <th className="py-1 pr-4 font-medium w-32 hidden sm:table-cell">種別</th>
                    <th className="py-1 font-medium">担当</th>
                  </tr>
                </thead>
                <tbody>
                  {monthDates.map((dateStr) => {
                    const date = parseDateStr(dateStr);
                    const dow = date.getDay();
                    const holidayName = getHolidayName(date, yearData.holidays);
                    const isMarathon = yearData.marathonDate === dateStr;
                    const isCompanyWork = yearData.companyWorkDays.includes(dateStr);
                    const periodLabel =
                      yearData.holidayPeriods.find(
                        (p) => dateStr >= p.start && dateStr <= p.end
                      )?.label ?? null;

                    // 種別ラベル
                    let typeLabel = "";
                    if (isMarathon) typeLabel = "マラソン";
                    else if (isCompanyWork) typeLabel = "全社出勤";
                    else if (periodLabel) typeLabel = periodLabel;
                    else if (holidayName) typeLabel = holidayName;

                    // 担当メンバー
                    const dayAssignments = assignments.filter((a) => a.date === dateStr);
                    const assignedMembers: Member[] = isCompanyWork
                      ? activeMembers
                      : (dayAssignments
                          .map((a) => members.find((m) => m.id === a.memberId))
                          .filter(Boolean) as Member[]);

                    return (
                      <tr key={dateStr} className="border-b border-gray-100">
                        <td className="py-1.5 pr-6">
                          <span className="font-medium text-gray-800">
                            {month + 1}/{date.getDate()}
                          </span>
                          <span
                            className={`ml-1.5 text-xs ${
                              dow === 6
                                ? "text-blue-500"
                                : dow === 0
                                  ? "text-red-400"
                                  : "text-gray-400"
                            }`}
                          >
                            ({DOW[dow]})
                          </span>
                        </td>
                        <td className="py-1.5 pr-4 text-xs text-gray-500 hidden sm:table-cell">
                          {typeLabel}
                        </td>
                        <td className="py-1.5">
                          {assignedMembers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedMembers.map((m) => (
                                <span
                                  key={m.id}
                                  className="inline-flex px-2 py-0.5 rounded text-xs font-semibold text-gray-700"
                                  style={{ backgroundColor: m.color }}
                                >
                                  {m.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-500 font-medium">未割当</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
