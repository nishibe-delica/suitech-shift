export interface Member {
  id: string;
  name: string;
  color: string;
  order: number;
  active: boolean;
  isMarathonMember: boolean;
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
  companyWorkDays: string[];
  marathonDate: string | null;
  rotationOrder: string[];
}

export interface Assignment {
  date: string;
  memberId: string;
  type: "rotation" | "marathon" | "manual";
  isLocked: boolean;
}
