import { useState } from "react";
import type { Member, YearData, Assignment } from "../types";
import { getFixedMemberHolidays } from "../utils/assignment";

const TARGET_DAYS = 105;

interface SummaryPanelProps {
  members: Member[];
  dutyCounts: Record<string, number>;
  individualHolidays: Record<string, number>;
  nextRotation: string | null;
  holidaySummary: {
    calendarHolidays: number;
    weekdayHolidays: number;
    saturdayCount: number;
    sundayCount: number;
    totalDutyDays: number;
    additionalWeekdays: number;
  };
  yearData: YearData;
  assignments: Assignment[];
}

export default function SummaryPanel({
  members,
  dutyCounts,
  individualHolidays,
  nextRotation,
  holidaySummary,
  yearData,
  assignments,
}: SummaryPanelProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  // 固定メンバー（佐竹さん）はローテーション集計・休日計算から除外
  const activeMembers = members.filter((m) => m.active && !m.isFixed);
  const additionalWeekdays = holidaySummary.additionalWeekdays;

  return (
    <div className="space-y-4">
      {/* ━━━ ローテーション順（常時表示・メイン） ━━━ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          ローテーション順
        </h3>
        <div className="flex items-center justify-center gap-1.5">
          {(() => {
            const idx = nextRotation ? yearData.rotationOrder.indexOf(nextRotation) : 0;
            const displayOrder = idx > 0
              ? [...yearData.rotationOrder.slice(idx), ...yearData.rotationOrder.slice(0, idx)]
              : yearData.rotationOrder;
            return displayOrder;
          })().map((memberId, idx) => {
            const member = members.find((m) => m.id === memberId);
            if (!member) return null;
            const isNext = memberId === nextRotation;
            return (
              <div key={memberId} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-gray-700 transition-all ${
                    isNext ? "ring-2 ring-brand-400 animate-pulse-ring scale-110 shadow-md" : ""
                  }`}
                  style={{ backgroundColor: member.color }}
                  title={member.name}
                >
                  {member.name}
                </div>
              </div>
            );
          })}
        </div>
        {nextRotation && assignments.length > 0 && (
          <p className="text-center mt-3 text-xs text-gray-500">
            次の当番:{" "}
            <span className="font-semibold text-brand-600">
              {members.find((m) => m.id === nextRotation)?.name}
            </span>
          </p>
        )}
        {assignments.length === 0 && (
          <p className="text-center mt-3 text-xs text-gray-400">
            「自動割り振り」を実行してください
          </p>
        )}
      </div>

      {/* ━━━ 詳細アコーディオン（デフォルト閉じ） ━━━ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setDetailOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <span>詳細を見る</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${detailOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {detailOpen && (
          <div className="border-t border-gray-100 divide-y divide-gray-50">
            {/* 当番回数 */}
            <div className="px-5 py-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                担当回数
              </h4>
              <div className="space-y-2">
                {activeMembers.map((member) => {
                  const count = dutyCounts[member.id] ?? 0;
                  const days = individualHolidays[member.id] ?? 0;
                  const diff = assignments.length > 0 ? days - TARGET_DAYS : null;
                  return (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: member.color }} />
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{count}回</span>
                        {diff !== null && (
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                            diff === 0
                              ? "bg-green-50 text-green-600"
                              : diff > 0
                                ? "bg-amber-50 text-amber-600"
                                : "bg-red-50 text-red-500"
                          }`}>
                            {days}日{diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 休日計算式 */}
            <div className="px-5 py-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                休日計算（共通）
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>[A] 暦上休日</span>
                  <span className="font-medium">{holidaySummary.calendarHolidays}日</span>
                </div>
                <div className="pl-3 space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between"><span>日曜</span><span>{holidaySummary.sundayCount}日</span></div>
                  <div className="flex justify-between"><span>土曜</span><span>{holidaySummary.saturdayCount}日</span></div>
                  <div className="flex justify-between"><span>平日祝日</span><span>{holidaySummary.weekdayHolidays}日</span></div>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>[B] 特別休暇（平日）</span>
                  <span className={`font-medium ${additionalWeekdays > 0 ? "text-blue-600" : ""}`}>
                    +{additionalWeekdays}日
                  </span>
                </div>
              </div>
            </div>

            {/* 佐竹さんの休日一覧 */}
            {(() => {
              const fixedMembers = members.filter((m) => m.active && m.isFixed);
              if (fixedMembers.length === 0) return null;
              const holidays = getFixedMemberHolidays(yearData);
              // 月ごとにグループ化
              const byMonth: Record<string, string[]> = {};
              for (const dateStr of holidays) {
                const [, m, d] = dateStr.split("-");
                const key = m; // "04", "05", ...
                if (!byMonth[key]) byMonth[key] = [];
                byMonth[key].push(`${parseInt(m)}/${parseInt(d)}`);
              }
              return (
                <div className="px-5 py-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    佐竹さんの休日
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(byMonth).map(([monthKey, dates]) => (
                      <div key={monthKey} className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-semibold text-gray-500 mr-1">
                          {parseInt(monthKey)}月:
                        </span>
                        {dates.join("・")}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">計 {holidays.length}日</p>
                </div>
              );
            })()}

            {/* マラソン当番 */}
            {yearData.marathonDate && (
              <div className="px-5 py-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  マラソン当番
                </h4>
                <div className="text-xs text-gray-600 mb-2">
                  {yearData.marathonDate.replace(/-/g, "/")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeMembers.filter((m) => m.isMarathonMember).map((member) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-gray-700"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
