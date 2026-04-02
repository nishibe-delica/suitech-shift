import type { Member, YearData, Assignment } from "../types";
import { formatDateStr, isDutyDay, parseDateStr } from "./calendar";

/** 年度内の全当番対象日を取得
 *  - 特別休暇期間外: 土曜 + 平日祝日
 *  - 特別休暇期間内: 日曜以外の全日 (noDutyDates に含まれる日は除外)
 *  ※ 全社出勤日も通常のローテーション対象に含める
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

    if (periodDateSet.has(dateStr)) {
      // 特別休暇期間内: 日曜以外は当番日（全社出勤日も含む）
      dutyDays.push(dateStr);
    } else {
      // 期間外: 土曜 + 平日祝日のみ（全社出勤日も含む）
      if (isDutyDay(d, yearData.holidays)) {
        dutyDays.push(dateStr);
      }
    }
  }

  return dutyDays;
}

/**
 * 不正な割り振りデータを除去する
 * - 祝日修正などで「当番対象日でなくなった日」の自動割り振りを削除
 * - ロック済み・マラソン・全社出勤日は保持
 */
export function sanitizeAssignments(
  assignments: Assignment[],
  yearData: YearData
): Assignment[] {
  const validDutyDays = new Set([
    ...getDutyDays(yearData),
    ...yearData.companyWorkDays,
  ]);

  return assignments.filter((a) => {
    // マラソン当番は常に保持
    if (a.type === "marathon") return true;
    // ロック済みは保持（ユーザーが意図的に設定）
    if (a.isLocked) return true;
    // 当番対象日・全社出勤日・マラソン日のみ保持
    return validDutyDays.has(a.date) || a.date === yearData.marathonDate;
  });
}

/** 自動割り振りを生成 */
export function generateAssignments(
  members: Member[],
  yearData: YearData,
  existingAssignments: Assignment[] = []
): Assignment[] {
  // ローテーション対象メンバーのみ（固定メンバーは除外）
  const rotationMembers = members.filter((m) => m.active && !m.isFixed);

  const lockedAssignments = existingAssignments.filter((a) => a.isLocked);
  const lockedDates = new Set(lockedAssignments.map((a) => a.date));

  const result: Assignment[] = [...lockedAssignments];

  // マラソン当番を固定（日曜でも割り振る）
  if (yearData.marathonDate && !lockedDates.has(yearData.marathonDate)) {
    const marathonMembers = rotationMembers.filter((m) => m.isMarathonMember);
    for (const m of marathonMembers) {
      result.push({
        date: yearData.marathonDate,
        memberId: m.id,
        type: "marathon",
        isLocked: false,
      });
    }
  }

  // マラソン日とロック済み日を除いた残り当番日（全社出勤日を含む）
  const remainingDays = getDutyDays(yearData).filter(
    (d) => !lockedDates.has(d) && d !== yearData.marathonDate
  );

  // ローテーション割り振り
  const order = yearData.rotationOrder.filter((id) =>
    rotationMembers.some((m) => m.id === id)
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

  // 全社出勤日: ローテーション担当者以外の全員を追加出勤として付与
  for (const companyDay of yearData.companyWorkDays) {
    // ロック済み or 自動割り振りでその日の担当者を探す
    const primary = result.find(
      (a) =>
        a.date === companyDay &&
        a.type !== "fixed" &&
        a.type !== "marathon"
    );
    if (!primary) continue;

    for (const memberId of order) {
      if (memberId === primary.memberId) continue;
      const alreadyAssigned = result.some(
        (a) =>
          a.date === companyDay &&
          a.memberId === memberId &&
          a.type !== "fixed"
      );
      if (!alreadyAssigned) {
        result.push({
          date: companyDay,
          memberId,
          type: "manual",
          isLocked: false,
        });
      }
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/** メンバー別当番回数（fixed タイプは除外） */
export function countByMember(
  assignments: Assignment[],
  members: Member[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of members) counts[m.id] = 0;
  for (const a of assignments) {
    if (a.type !== "fixed" && a.memberId in counts) counts[a.memberId]++;
  }
  return counts;
}

/** 次の当番者を取得（今日以降で最初に当番が来る人） */
export function getNextRotationMember(
  assignments: Assignment[],
  yearData: YearData
): string | null {
  const today = formatDateStr(new Date());

  // 今日以降のローテーション割り振りを日付順に取得
  const upcoming = assignments
    .filter((a) => a.type === "rotation" && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length > 0) return upcoming[0].memberId;

  // 未来の割り振りがない場合は最後の割り振りの次の人
  const all = assignments
    .filter((a) => a.type === "rotation")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (all.length === 0) return yearData.rotationOrder[0] || null;

  const lastMemberId = all[all.length - 1].memberId;
  const idx = yearData.rotationOrder.indexOf(lastMemberId);
  return yearData.rotationOrder[(idx + 1) % yearData.rotationOrder.length];
}

/** 個人ごとの年間休日日数を計算
 *  年間休日 = [A]暦上休日 + [B]特別休暇平日 - [C]当番出勤 - [D]全社出勤
 *  ※ 固定メンバーは対象外
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

/** 固定メンバー（佐竹さん）の休日一覧を返す
 *  休日 = 土曜・日曜・祝日・特別休暇期間内の全日
 */
export function getFixedMemberHolidays(yearData: YearData): string[] {
  const start = parseDateStr(yearData.startDate);
  const end = parseDateStr(yearData.endDate);
  const holidayDateSet = new Set(yearData.holidays.map((h) => h.date));

  const periodDateSet = new Set<string>();
  for (const period of yearData.holidayPeriods) {
    const ps = parseDateStr(period.start);
    const pe = parseDateStr(period.end);
    for (let d = new Date(ps); d <= pe; d.setDate(d.getDate() + 1)) {
      periodDateSet.add(formatDateStr(d));
    }
  }

  const result: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateStr(d);
    const dow = d.getDay();
    if (dow === 0 || dow === 6 || holidayDateSet.has(dateStr) || periodDateSet.has(dateStr)) {
      result.push(dateStr);
    }
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
