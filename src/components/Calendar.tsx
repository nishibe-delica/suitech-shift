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
  companyWorkDays: string[];
  onAssignmentToggle: (date: string, memberId: string) => void;
  onUnlock: (date: string) => void;
  fiscalYear: number;
}

/** 特別休暇期間内かどうかを判定（noDutyDates・全社出勤日を考慮） */
function isHolidayPeriodDutyDay(
  date: Date,
  holidayPeriods: HolidayPeriod[],
  companyWorkDays: string[]
): boolean {
  if (date.getDay() === 0) return false; // 日曜は対象外
  const dateStr = formatDateStr(date);
  if (companyWorkDays.includes(dateStr)) return false;
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
  companyWorkDays,
  onAssignmentToggle,
  onUnlock,
  fiscalYear,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(fiscalYear, 3, 1));
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(null);

  // 年度切替時に4月へリセット
  useEffect(() => {
    setCurrentDate(new Date(fiscalYear, 3, 1));
    setOpenDropdown(null);
  }, [fiscalYear]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getCalendarDays(year, month);

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
                    ? "bg-red-100 text-red-500"
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
            const dutyDay = isDutyDay(date, holidays) || isHolidayPeriodDutyDay(date, holidayPeriods, companyWorkDays);
            const dateAssignments = getAssignmentsForDate(date);
            const primaryAssignment = dateAssignments[0];
            const primaryMember = primaryAssignment
              ? getMember(primaryAssignment.memberId)
              : undefined;
            const isMarathonDay = dateAssignments.some(
              (a) => a.type === "marathon"
            );
            const isCompanyWorkDay = companyWorkDays.includes(dateStr);
            const periodLabel = holidayPeriods.find(
              (p) => dateStr >= p.start && dateStr <= p.end
            )?.label ?? null;
            const isDropdownOpen = openDropdown === dateStr;

            const isInHolidayPeriod = periodLabel !== null && !isCompanyWorkDay;
            const isInteractive = isMarathonDay || (!sunday && !isCompanyWorkDay);

            let cellClasses = "min-h-[6.5rem] p-2.5 relative ";
            if (isCompanyWorkDay) {
              cellClasses += "bg-amber-50";
            } else if (isMarathonDay) {
              cellClasses += "bg-orange-50";
            } else if (sunday) {
              cellClasses += "bg-white";
            } else if (primaryMember && dutyDay) {
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

            return (
              <div
                key={dateStr}
                className={cellClasses}
                style={
                  primaryMember && !sunday && !isMarathonDay && !isCompanyWorkDay && dateAssignments.length === 1
                    ? { backgroundColor: primaryMember.color }
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
                  <span
                    className={`text-base font-semibold ${
                      sunday
                        ? "text-red-500"
                        : saturday
                          ? "text-blue-600"
                          : holidayName
                            ? "text-red-500"
                            : "text-gray-700"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {/* ロックアイコン */}
                  {primaryAssignment?.isLocked && (
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* 祝日名 */}
                {holidayName && !sunday && (
                  <div className="text-xs text-red-400 truncate leading-tight mt-0.5">
                    {holidayName}
                  </div>
                )}


                {/* 特別休暇期間ラベル */}
                {periodLabel && !isCompanyWorkDay && (
                  <div className="text-xs text-purple-500 font-bold truncate leading-tight mt-0.5">
                    {periodLabel}
                  </div>
                )}

                {/* マラソン当番（3名表示） */}
                {isMarathonDay && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-xs text-orange-600 font-bold">揖斐川マラソン</span>
                    {dateAssignments.map((a) => {
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

                {/* 全社出勤日（全員表示） */}
                {isCompanyWorkDay && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-xs text-amber-600 font-bold">全社出勤</span>
                    {members.filter((m) => m.active).map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold text-gray-700 animate-fade-in"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* 通常当番（複数人対応） */}
                {!isMarathonDay && !isCompanyWorkDay && dateAssignments.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5 animate-fade-in">
                    {dateAssignments.map((a) => {
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
                {(dutyDay || isInHolidayPeriod) && !primaryMember && !isCompanyWorkDay && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-400">当番</span>
                  </div>
                )}

                {/* ドロップダウン */}
                {isDropdownOpen && isInteractive && dropdownAnchorRect && (
                  <MemberDropdown
                    anchorRect={dropdownAnchorRect}
                    members={members}
                    selectedMemberIds={dateAssignments.filter((a) => a.type !== "marathon").map((a) => a.memberId)}
                    hasLocked={dateAssignments.some((a) => a.isLocked)}
                    onToggle={(memberId) => {
                      onAssignmentToggle(dateStr, memberId);
                    }}
                    onUnlock={() => {
                      onUnlock(dateStr);
                      setOpenDropdown(null);
                      setDropdownAnchorRect(null);
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
