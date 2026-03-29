import type { Member, YearData, Assignment } from "../types";
import { formatDateStr, isDutyDay, parseDateStr } from "./calendar";

/** 年度内の全当番対象日を取得
 *  - 特別休暇期間外: 土曜 + 平日祝日
 *  - 特別休暇期間内: 日曜以外の全日 (noDutyDates に含まれる日は除外)
 *  - 全社出勤日は常に除外
 */
export function getDutyDays(yearData: YearData): string[] {
  const start = parseDateStr(yearData.startDate);
  const end = parseDateStr(yearData.endDate);
  const dutyDays: string[] = [];

  // noDutyDates の集合を構築
  const noDutySet = new Set<string>();
  for (const period of yearData.holidayPeriods) {
    for (const d of period.noDutyDates) {
      noDutySet.add(d);
    }
  }

  // 特別休暇期間の日付集合を構築
  const periodDateSet = new Set<string>();
  for (const period of yearData.holidayPeriods) {
    const ps = parseDateStr(period.start);
    const pe = parseDateStr(period.end);
    for (let d = new Date(ps); d <= pe; d.setDate(d.getDate() + 1)) {
      periodDateSet.add(formatDateStr(d));
    }
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateStr(d);
    if (d.getDay() === 0) continue; // 日曜は常に当番なし
    if (noDutySet.has(dateStr)) continue; // 担当制なし
    if (yearData.companyWorkDays.includes(dateStr)) continue;

    if (periodDateSet.has(dateStr)) {
      // 特別休暇期間内: 日曜以外は当番日
      dutyDays.push(dateStr);
    } else {
      // 期間外: 土曜 + 平日祝日のみ
      if (isDutyDay(d, yearData.holidays)) {
        dutyDays.push(dateStr);
      }
    }
  }

  return dutyDays;
}

/** 自動割り振りを生成 */
export function generateAssignments(
  members: Member[],
  yearData: YearData,
  existingAssignments: Assignment[] = []
): Assignment[] {
  const activeMembers = members.filter((m) => m.active);
  const lockedAssignments = existingAssignments.filter((a) => a.isLocked);
  const lockedDates = new Set(lockedAssignments.map((a) => a.date));
  const result: Assignment[] = [...lockedAssignments];

  const allDutyDays = getDutyDays(yearData);

  // マラソン当番を固定（日曜でも割り振る）
  if (yearData.marathonDate && !lockedDates.has(yearData.marathonDate)) {
    const marathonMembers = activeMembers.filter((m) => m.isMarathonMember);
    for (const m of marathonMembers) {
      result.push({
        date: yearData.marathonDate,
        memberId: m.id,
        type: "marathon",
        isLocked: false,
      });
    }
  }

  // マラソン日とロック済み日を除いた残り当番日
  const assignedDates = new Set(result.map((a) => a.date));
  const remainingDays = allDutyDays.filter((d) => !assignedDates.has(d));

  // ローテーション割り振り
  const order = yearData.rotationOrder.filter((id) =>
    activeMembers.some((m) => m.id === id)
  );
  let rotationIdx = 0;

  for (const day of remainingDays) {
    result.push({
      date: day,
      memberId: order[rotationIdx % order.length],
      type: "rotation",
      isLocked: false,
    });
    rotationIdx++;
  }

  // 均等化チェック
  equalize(result, order);

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/** 回数均等化: max-min >= 2 の場合、後ろの方の割り当てを入れ替え */
function equalize(assignments: Assignment[], memberIds: string[]) {
  for (let iter = 0; iter < 50; iter++) {
    const counts = countFromArray(assignments, memberIds);
    const max = Math.max(...Object.values(counts));
    const min = Math.min(...Object.values(counts));
    if (max - min < 2) break;

    const overMembers = memberIds.filter((id) => counts[id] === max);
    const underMembers = memberIds.filter((id) => counts[id] === min);

    let swapped = false;
    for (let i = assignments.length - 1; i >= 0 && !swapped; i--) {
      const a = assignments[i];
      if (
        a.type === "rotation" &&
        !a.isLocked &&
        overMembers.includes(a.memberId)
      ) {
        a.memberId = underMembers[0];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
}

function countFromArray(
  assignments: Assignment[],
  memberIds: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of memberIds) counts[id] = 0;
  for (const a of assignments) {
    if (a.memberId in counts) counts[a.memberId]++;
  }
  return counts;
}

/** メンバー別当番回数 */
export function countByMember(
  assignments: Assignment[],
  members: Member[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of members) counts[m.id] = 0;
  for (const a of assignments) {
    if (a.memberId in counts) counts[a.memberId]++;
  }
  return counts;
}

/** 次の当番者を取得 */
export function getNextRotationMember(
  assignments: Assignment[],
  yearData: YearData
): string | null {
  const rotationAssignments = assignments
    .filter((a) => a.type === "rotation")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (rotationAssignments.length === 0) return yearData.rotationOrder[0] || null;

  const lastMemberId = rotationAssignments[rotationAssignments.length - 1].memberId;
  const idx = yearData.rotationOrder.indexOf(lastMemberId);
  return yearData.rotationOrder[(idx + 1) % yearData.rotationOrder.length];
}

/** 個人ごとの年間休日日数を計算
 *  年間休日 = [A]暦上休日 + [B]特別休暇平日 - [C]当番出勤 - [D]全社出勤
 */
export function computeIndividualHolidays(
  yearData: YearData,
  dutyCounts: Record<string, number>,
  calendarHolidays: number,
  additionalWeekdays: number
): Record<string, number> {
  const companyWorkDays = yearData.companyWorkDays.length;
  const result: Record<string, number> = {};
  for (const [id, count] of Object.entries(dutyCounts)) {
    result[id] = calendarHolidays + additionalWeekdays - count - companyWorkDays;
  }
  return result;
}

/** 休日サマリー計算 */
export function computeHolidaySummary(yearData: YearData): {
  calendarHolidays: number;
  weekdayHolidays: number;
  saturdayCount: number;
  sundayCount: number;
  totalDutyDays: number;
  additionalWeekdays: number;
} {
  const start = parseDateStr(yearData.startDate);
  const end = parseDateStr(yearData.endDate);

  let sundayCount = 0;
  let saturdayCount = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) sundayCount++;
    if (d.getDay() === 6) saturdayCount++;
  }

  const weekdayHolidays = yearData.holidays.length;
  const calendarHolidays = sundayCount + saturdayCount + weekdayHolidays;
  const dutyDays = getDutyDays(yearData);

  // [B]: 特別休暇期間内の平日（月〜金・非祝日）の日数
  const holidayDateSet = new Set(yearData.holidays.map((h) => h.date));
  let additionalWeekdays = 0;
  for (const period of yearData.holidayPeriods) {
    const ps = parseDateStr(period.start);
    const pe = parseDateStr(period.end);
    for (let d = new Date(ps); d <= pe; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      const dateStr = formatDateStr(d);
      if (dow !== 0 && dow !== 6 && !holidayDateSet.has(dateStr)) {
        additionalWeekdays++;
      }
    }
  }

  return {
    calendarHolidays,
    weekdayHolidays,
    saturdayCount,
    sundayCount,
    totalDutyDays: dutyDays.length,
    additionalWeekdays,
  };
}
