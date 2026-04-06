import type { YearData } from "../types";
import { defaultYearData } from "./holidays2026";
import { defaultYearData2027 } from "./holidays2027";
import { defaultRotationOrder } from "./members";

// 2026年度から現在年度+4年まで自動生成（毎年追加不要）
const FIRST_YEAR = 2026;
const LAST_YEAR = Math.max(new Date().getFullYear() + 4, 2031);

export const SUPPORTED_YEARS: number[] = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, i) => FIRST_YEAR + i
);

export function getDefaultYearData(fiscalYear: number): YearData {
  if (fiscalYear === 2026) return defaultYearData;
  if (fiscalYear === 2027) return defaultYearData2027;
  // 2028年度以降: 祝日データなし（手動設定可）
  return {
    fiscalYear,
    startDate: `${fiscalYear}-04-01`,
    endDate: `${fiscalYear + 1}-03-31`,
    holidays: [],
    assignments: [],
    holidayPeriods: [],
    marathonDate: null,
    rotationOrder: defaultRotationOrder,
  };
}
