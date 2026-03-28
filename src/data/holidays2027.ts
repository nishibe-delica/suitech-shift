// 2027年度（2027-04-01 〜 2028-03-31）の平日祝日（当番対象分のみ）
export const holidays2027 = [
  { date: "2027-04-29", name: "昭和の日（木）" },
  { date: "2027-05-03", name: "憲法記念日（月）" },
  { date: "2027-05-04", name: "みどりの日（火）" },
  { date: "2027-05-05", name: "こどもの日（水）" },
  { date: "2027-07-19", name: "海の日（月）" },
  { date: "2027-08-11", name: "山の日（水）" },
  { date: "2027-09-20", name: "敬老の日（月）" },
  { date: "2027-09-23", name: "秋分の日（木）" },
  { date: "2027-10-11", name: "スポーツの日（月）" },
  { date: "2027-11-03", name: "文化の日（水）" },
  { date: "2027-11-23", name: "勤労感謝の日（火）" },
  { date: "2027-12-23", name: "天皇誕生日（木）" },
  { date: "2028-01-10", name: "成人の日（月）" },
  { date: "2028-02-11", name: "建国記念の日（金）" },
  { date: "2028-02-23", name: "天皇誕生日（水）" },
  { date: "2028-03-20", name: "春分の日（月）" },
];

export const defaultYearData2027 = {
  fiscalYear: 2027,
  startDate: "2027-04-01",
  endDate: "2028-03-31",
  holidays: holidays2027,
  assignments: [],
  holidayPeriods: [],
  companyWorkDays: [],
  marathonDate: "2027-11-14", // 11月第2日曜（暫定）
  rotationOrder: ["taniwaki", "miki", "nishibe", "yamada"],
};
