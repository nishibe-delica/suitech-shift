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
import type { Assignment, Member } from "../types";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

interface CalendarProps {
  assignments: Assignment[];
  members: Member[];
  holidays: { date: string; name: string }[];
  onAssignmentChange: (date: string, memberId: string) => void;
  onUnlock: (date: string) => void;
  fiscalYear: number;
}

export default function Calendar({
  assignments,
  members,
  holidays,
  onAssignmentChange,
  onUnlock,
  fiscalYear,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(fiscalYear, 3, 1));
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setOpenDropdown(null);
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
              className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${
                i === 5
                  ? "bg-blue-50 text-blue-500"
                  : i === 6
                    ? "bg-gray-50 text-gray-400"
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
                <div key={`empty-${i}`} className="min-h-[5.5rem] bg-white" />
              );
            }

            const dateStr = formatDateStr(date);
            const sunday = isSunday(date);
            const saturday = isSaturday(date);
            const holidayName = getHolidayName(date, holidays);
            const dutyDay = isDutyDay(date, holidays);
            const dateAssignments = getAssignmentsForDate(date);
            const primaryAssignment = dateAssignments[0];
            const primaryMember = primaryAssignment
              ? getMember(primaryAssignment.memberId)
              : undefined;
            const isMarathonDay = dateAssignments.some(
              (a) => a.type === "marathon"
            );
            const isDropdownOpen = openDropdown === dateStr;

            let cellClasses = "min-h-[5.5rem] p-2 relative ";
            if (sunday) {
              cellClasses += "bg-gray-50";
            } else if (primaryMember && dutyDay) {
              cellClasses += "";
            } else if (saturday) {
              cellClasses += "bg-blue-50/30";
            } else {
              cellClasses += "bg-white";
            }

            if (dutyDay && !sunday) {
              cellClasses +=
                " cursor-pointer group hover:ring-2 hover:ring-inset hover:ring-brand-200 transition-all duration-150";
            }

            return (
              <div
                key={dateStr}
                className={cellClasses}
                style={
                  primaryMember && dutyDay && !sunday
                    ? { backgroundColor: primaryMember.color }
                    : undefined
                }
                onClick={() => {
                  if (dutyDay && !sunday) {
                    setOpenDropdown(isDropdownOpen ? null : dateStr);
                  }
                }}
              >
                {/* 日付番号 */}
                <div className="flex items-start justify-between">
                  <span
                    className={`text-sm font-medium ${
                      sunday
                        ? "text-gray-400"
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
                  <div className="text-[10px] text-red-400 truncate leading-tight mt-0.5">
                    {holidayName}
                  </div>
                )}

                {/* マラソン当番（3名表示） */}
                {isMarathonDay && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dateAssignments.map((a) => {
                      const m = getMember(a.memberId);
                      if (!m) return null;
                      return (
                        <span
                          key={a.memberId}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-700 animate-fade-in"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 通常当番 */}
                {!isMarathonDay && dutyDay && primaryMember && !sunday && (
                  <div className="mt-2 text-center animate-fade-in">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-gray-800">
                      {primaryMember.name}
                    </span>
                  </div>
                )}

                {/* 当番対象日マーカー（未割当） */}
                {dutyDay && !primaryMember && !sunday && (
                  <div className="mt-2 text-center">
                    <span className="text-[10px] text-gray-400">当番</span>
                  </div>
                )}

                {/* ドロップダウン */}
                {isDropdownOpen && dutyDay && !sunday && (
                  <MemberDropdown
                    members={members}
                    currentMemberId={primaryAssignment?.memberId ?? null}
                    isLocked={primaryAssignment?.isLocked ?? false}
                    onSelect={(memberId) => {
                      onAssignmentChange(dateStr, memberId);
                      setOpenDropdown(null);
                    }}
                    onUnlock={() => {
                      onUnlock(dateStr);
                      setOpenDropdown(null);
                    }}
                    onClose={() => setOpenDropdown(null)}
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
