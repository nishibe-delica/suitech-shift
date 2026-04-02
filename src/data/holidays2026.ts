export const holidays2026 = [
  { date: "2026-04-29", name: "昭和の日" },
  { date: "2026-05-03", name: "憲法記念日" },   // 日曜（振替休日は5/6）
  { date: "2026-05-04", name: "みどりの日" },
  { date: "2026-05-05", name: "こどもの日" },
  { date: "2026-05-06", name: "振替休日" },
  { date: "2026-07-20", name: "海の日" },
  { date: "2026-08-11", name: "山の日" },
  { date: "2026-09-21", name: "敬老の日" },
  { date: "2026-09-22", name: "国民の休日" },   // 敬老の日と秋分の日に挟まれた日
  { date: "2026-09-23", name: "秋分の日" },
  { date: "2026-10-12", name: "スポーツの日" },
  { date: "2026-11-03", name: "文化の日" },
  { date: "2026-11-23", name: "勤労感謝の日" },
  // 12/23 天皇誕生日は削除（天皇誕生日は2/23）
  { date: "2027-01-01", name: "元日" },
  { date: "2027-01-11", name: "成人の日" },     // 1/11（月）に修正
  { date: "2027-02-11", name: "建国記念の日" },
  { date: "2027-02-23", name: "天皇誕生日" },
  { date: "2027-03-21", name: "春分の日" },     // 日曜（振替休日は3/22）
  { date: "2027-03-22", name: "振替休日" },     // 春分の日の振替（月曜・当番対象）
];

export const defaultYearData = {
  fiscalYear: 2026,
  startDate: "2026-04-01",
  endDate: "2027-03-31",
  holidays: holidays2026,
  assignments: [],
  holidayPeriods: [],
  companyWorkDays: [],
  marathonDate: "2026-11-08",
  rotationOrder: ["taniwaki", "miki", "nishibe", "yamada"],
};
