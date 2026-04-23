export interface Member {
  id: string;
  name: string;
  color: string;
  order: number;
  active: boolean;
  isMarathonMember: boolean;
  /** true の場合、ローテーション対象外の固定メンバー（例: 佐竹） */
  isFixed?: boolean;
}

export interface HolidayPeriod {
  id: string;
  label: string;
  start: string;
  end: string;
  noDutyDates: string[]; // 担当制なし（全員休み）にした日のリスト
}

export interface YearData {
  fiscalYear: number;
  startDate: string;
  endDate: string;
  holidays: { date: string; name: string }[];
  assignments: Assignment[];
  holidayPeriods: HolidayPeriod[];
  companyWorkDays?: string[]; // 廃止（後方互換のためオプショナルで残す）
  marathonDate: string | null;
  rotationOrder: string[];
}

export interface Assignment {
  date: string;
  memberId: string;
  /** fixed = 佐竹さんなど固定メンバーの自動割り振り */
  type: "rotation" | "marathon" | "manual" | "fixed";
}
