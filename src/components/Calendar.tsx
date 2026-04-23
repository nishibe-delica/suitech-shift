import { useState, useEffect } from "react";
import {
  getCalendarDays,
  isSunday,
  isSaturday,
  formatDateStr,
  getHolidayName,
  isDutyDay,
} from "../utils/calendar";
import MemberDropdown from "./MemberDropdown";
import type { Assignment, Member, HolidayPeriod } from "../types";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

interface CalendarProps {
  assignments: Assignment[];
  members: Member[];
  holidays: { date: string; name: string }[];
  holidayPeriods: HolidayPeriod[];
  onAssignmentToggle: (date: string, memberId: string) => void;
  fiscalYear: number;
  isAdmin: boolean;
}

/** 特別休暇期間内かどうかを判定 */
function isHolidayPeriodDutyDay(
  date: Date,
  holidayPeriods: HolidayPeriod[]
): boolean {
  if (date.getDay() === 0) return false; // 日曜は対象外
  const dateStr = formatDateStr(date);
  for (const period of holidayPeriods) {
    if (dateStr >= period.start && dateStr <= period.end) {
      if (period.noDutyDates.includes(dateStr)) return false;
      return true;
    }
  }
  return false;
}

export default function Calendar({
  assignments,
  members,
  holidays,
  holidayPeriods,
  onAssignmentToggle,
  fiscalYear,
  isAdmin,
}: CalendarProps) {
  // 当該年度内なら当月、範囲外なら4月にフォールバック
  function getInitialMonth(fy: number): Date {
    const now = new Date();
    const fyStart = new Date(fy, 3, 1);
    const fyEnd = new Date(fy + 1, 3, 0); // 翌年3月末
    if (now >= fyStart && now <= fyEnd) {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return fyStart;
  }

  const [currentDate, setCurrentDate] = useState(() => getInitialMonth(fiscalYear));
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(null);

  // 年度切替時に当月（または4月）へリセット
  useEffect(() => {
    setCurrentDate(getInitialMonth(fiscalYear));
    setOpenDropdown(null);
  }, [fiscalYear]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getCalendarDays(year, month);
  const todayStr = formatDateStr(new Date());

  const monthLabel = `${year}年${month + 1}月`;

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setOpenDropdown(null);
    setDropdownAnchorRect(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setOpenDropdown(null);
    setDropdownAnchorRect(null);
  }

  function getAssignmentsForDate(date: Date): Assignment[] {
    const dateStr = formatDateStr(date);
    return assignments.filter((a) => a.date === dateStr);
  }

  function getMember(memberId: string): Member | undefined {
    return members.find((m) => m.id === memberId);
  }

  return (
    <div className="w-full">
      {/* ヘッダー: 月送り */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-brand-50 hover:border-brand-300 active:scale-95 transition-all duration-150 flex items-center justify-center text-gray-600 hover:text-brand-600 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-brand-50 hover:border-brand-300 active:scale-95 transition-all duration-150 flex items-center justify-center text-gray-600 hover:text-brand-600 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 gap-px">
          {/* 曜日ヘッダー */}
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`py-3 text-center text-sm font-bold tracking-wider ${
                i === 5
                  ? "bg-blue-50 text-blue-500"
                  : i === 6
                    ? "bg-red-50 text-red-400"
                    : "bg-white text-gray-500"
              }`}
            >
              {label}
            </div>
          ))}

          {/* 日付セル */}
          {days.map((date, i) => {
            if (!date) {
              return (
                <div key={`empty-${i}`} className="min-h-[6.5rem] bg-white" />
              );
            }

            const dateStr = formatDateStr(date);
            const sunday = isSunday(date);
            const saturday = isSaturday(date);
            const holidayName = getHolidayName(date, holidays);
            const dutyDay = isDutyDay(date, holidays) || isHolidayPeriodDutyDay(date, holidayPeriods);
            const dateAssignments = getAssignmentsForDate(date);

            // type:"fixed" は旧データとの互換のためフィルタ除外
            const rotationAssignments = dateAssignments.filter((a) => a.type !== "fixed");
            const primaryRotationAssignment = rotationAssignments[0];
            const primaryRotationMember = primaryRotationAssignment
              ? getMember(primaryRotationAssignment.memberId)
              : undefined;

            const isMarathonDay = rotationAssignments.some((a) => a.type === "marathon");
            const periodLabel = holidayPeriods.find(
              (p) => dateStr >= p.start && dateStr <= p.end
            )?.label ?? null;
            const isDropdownOpen = openDropdown === dateStr;

            const isInHolidayPeriod = periodLabel !== null;
            // 管理者のみインタラクティブ（日曜は例外: マラソン日のみ可）
            const isInteractive = isAdmin && (isMarathonDay || !sunday);
            const isToday = dateStr === todayStr;

            let cellClasses = "min-h-[6.5rem] p-2.5 relative ";
            if (isMarathonDay) {
              cellClasses += "bg-orange-50";
            } else if (sunday) {
              cellClasses += "bg-white";
            } else if (primaryRotationMember && dutyDay) {
              cellClasses += "";
            } else if (saturday) {
              cellClasses += "bg-blue-50/30";
            } else {
              cellClasses += "bg-white";
            }

            if (isInteractive) {
              cellClasses +=
                " cursor-pointer group hover:ring-2 hover:ring-inset hover:ring-brand-200 transition-all duration-150";
            }
            if (isToday) {
              cellClasses += " ring-2 ring-inset ring-brand-500";
            }

            return (
              <div
                key={dateStr}
                className={cellClasses}
                style={
                  primaryRotationMember &&
                  !sunday &&
                  !isMarathonDay &&
                  rotationAssignments.length === 1
                    ? { backgroundColor: primaryRotationMember.color }
                    : undefined
                }
                onClick={(e) => {
                  if (isInteractive) {
                    if (isDropdownOpen) {
                      setOpenDropdown(null);
                      setDropdownAnchorRect(null);
                    } else {
                      setDropdownAnchorRect((e.currentTarget as HTMLElement).getBoundingClientRect());
                      setOpenDropdown(dateStr);
                    }
                  }
                }}
              >
                {/* 日付番号 */}
                <div className="flex items-start justify-between">
                  <div className={isToday ? "w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center -mt-0.5 -ml-0.5" : ""}>
                    <span
                      className={`text-base font-semibold ${
                        isToday
                          ? "text-white"
                          : sunday
                            ? "text-red-400"
                            : saturday
                              ? "text-blue-600"
                              : holidayName
                                ? "text-red-500"
                                : "text-gray-700"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  </div>

                {/* 祝日名 */}
                {holidayName && !sunday && (
                  <div className="text-xs text-red-400 truncate leading-tight mt-0.5">
                    {holidayName}
                  </div>
                )}

                {/* 特別休暇期間ラベル */}
                {periodLabel && (
                  <div className="text-xs text-purple-500 font-bold truncate leading-tight mt-0.5">
                    {periodLabel}
                  </div>
                )}

                {/* マラソン当番（3名表示） */}
                {isMarathonDay && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-xs text-orange-600 font-bold">揖斐川マラソン</span>
                    {rotationAssignments.map((a) => {
                      const m = getMember(a.memberId);
                      if (!m) return null;
                      return (
                        <span
                          key={a.memberId}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold text-gray-700 animate-fade-in"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 通常当番（ローテーション担当） */}
                {!isMarathonDay && rotationAssignments.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5 animate-fade-in">
                    {rotationAssignments.map((a) => {
                      const m = getMember(a.memberId);
                      if (!m) return null;
                      return (
                        <span
                          key={a.memberId}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold text-gray-700"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 当番対象日マーカー（未割当） */}
                {(dutyDay || isInHolidayPeriod) &&
                  !primaryRotationMember && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-400">当番</span>
                  </div>
                )}

                {/* ドロップダウン */}
                {isDropdownOpen && isInteractive && dropdownAnchorRect && (
                  <MemberDropdown
                    anchorRect={dropdownAnchorRect}
                    members={members}
                    selectedMemberIds={rotationAssignments.map((a) => a.memberId)}
                    onToggle={(memberId) => {
                      onAssignmentToggle(dateStr, memberId);
                    }}
                    onClose={() => { setOpenDropdown(null); setDropdownAnchorRect(null); }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
