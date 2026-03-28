import type { YearData } from "../types";
import { defaultYearData } from "./holidays2026";
import { defaultYearData2027 } from "./holidays2027";

export const SUPPORTED_YEARS = [2026, 2027];

export function getDefaultYearData(fiscalYear: number): YearData {
  switch (fiscalYear) {
    case 2027:
      return defaultYearData2027;
    case 2026:
    default:
      return defaultYearData;
  }
}
