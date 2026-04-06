// 2027年度（2027-04-01 〜 2028-03-31）の祝日（内閣府公式データ準拠）
export const holidays2027 = [
  { date: "2027-04-29", name: "昭和の日" },
  { date: "2027-05-03", name: "憲法記念日" },
  { date: "2027-05-04", name: "みどりの日" },
  { date: "2027-05-05", name: "こどもの日" },
  { date: "2027-07-19", name: "海の日" },
  { date: "2027-08-11", name: "山の日" },
  { date: "2027-09-20", name: "敬老の日" },
  { date: "2027-09-23", name: "秋分の日" },
  { date: "2027-10-11", name: "スポーツの日" },
  { date: "2027-11-03", name: "文化の日" },
  { date: "2027-11-23", name: "勤労感謝の日" },
  // 12/23 天皇誕生日は削除（天皇誕生日は2/23）
  { date: "2028-01-01", name: "元日" },           // 土曜（振替休日は1/3）
  { date: "2028-01-03", name: "振替休日" },        // 元日の振替（月曜・当番対象）
  { date: "2028-01-10", name: "成人の日" },
  { date: "2028-02-11", name: "建国記念の日" },
  { date: "2028-02-23", name: "天皇誕生日" },
  { date: "2028-03-20", name: "春分の日" },
];

export const defaultYearData2027 = {
  fiscalYear: 2027,
  startDate: "2027-04-01",
  endDate: "2028-03-31",
  holidays: holidays2027,
  assignments: [],
  holidayPeriods: [],
  marathonDate: "2027-11-14",
  rotationOrder: ["taniwaki", "miki", "nishibe", "yamada"],
};
