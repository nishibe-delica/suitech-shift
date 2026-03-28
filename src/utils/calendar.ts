/**
 * カレンダーユーティリティ関数
 */

/** 月曜始まりの曜日インデックス (0=月, 6=日) */
export function getMondayBasedDay(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

/** 指定月のカレンダーグリッド用の日付配列を返す（月曜始まり、前後月パディング含む） */
export function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = getMondayBasedDay(firstDay);

  const days: (Date | null)[] = [];

  // 前月のパディング
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  // 当月の日付
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

/** 日曜かどうか */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/** 土曜かどうか */
export function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

/** 日付をYYYY-MM-DD形式の文字列に変換 */
export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD文字列をDateに変換 */
export function parseDateStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 祝日リストから指定日の祝日名を取得（なければnull） */
export function getHolidayName(
  date: Date,
  holidays: { date: string; name: string }[]
): string | null {
  const dateStr = formatDateStr(date);
  const holiday = holidays.find((h) => h.date === dateStr);
  return holiday ? holiday.name : null;
}

/** 当番対象日かどうか（土曜 or 平日祝日、日曜は対象外） */
export function isDutyDay(
  date: Date,
  holidays: { date: string; name: string }[]
): boolean {
  if (isSunday(date)) return false;
  if (isSaturday(date)) return true;
  return getHolidayName(date, holidays) !== null;
}
