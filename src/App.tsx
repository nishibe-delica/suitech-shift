import { useState, useMemo, useEffect } from "react";
import Header from "./components/Header";
import MemberLegendBar from "./components/MemberLegendBar";
import Calendar from "./components/Calendar";
import SummaryPanel from "./components/SummaryPanel";
import SettingsModal from "./components/SettingsModal";
import YearlyView from "./components/YearlyView";
import { defaultMembers } from "./data/members";
import { getDefaultYearData } from "./data/yearDefaults";
import {
  generateAssignments,
  countByMember,
  getNextRotationMember,
  computeHolidaySummary,
  computeIndividualHolidays,
} from "./utils/assignment";
import {
  saveToStorage,
  loadFromStorage,
  exportJSON,
  importJSON,
  cloudPushAll,
  cloudPullAll,
  saveGasUrl,
  loadGasUrl,
} from "./utils/storage";
import type { Assignment, Member, YearData } from "./types";

const INITIAL_FISCAL_YEAR = 2026;

function loadYear(fiscalYear: number): { yearData: YearData; assignments: Assignment[] } {
  const saved = loadFromStorage(fiscalYear);
  return {
    yearData: saved?.yearData ?? getDefaultYearData(fiscalYear),
    assignments: saved?.assignments ?? [],
  };
}

function App() {
  const [members] = useState<Member[]>(defaultMembers);
  const [currentFiscalYear, setCurrentFiscalYear] = useState(INITIAL_FISCAL_YEAR);
  const [yearData, setYearData] = useState<YearData>(
    () => loadYear(INITIAL_FISCAL_YEAR).yearData
  );
  const [assignments, setAssignments] = useState<Assignment[]>(
    () => loadYear(INITIAL_FISCAL_YEAR).assignments
  );
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "yearly">("calendar");
  const [gasUrl, setGasUrl] = useState(() => loadGasUrl());

  // 変更のたびにlocalStorageへ自動保存
  useEffect(() => {
    saveToStorage(yearData, assignments);
  }, [yearData, assignments]);

  const dutyCounts = useMemo(
    () => countByMember(assignments, members),
    [assignments, members]
  );

  const nextRotation = useMemo(
    () => getNextRotationMember(assignments, yearData),
    [assignments, yearData]
  );

  const holidaySummary = useMemo(
    () => computeHolidaySummary(yearData),
    [yearData]
  );

  const individualHolidays = useMemo(
    () => computeIndividualHolidays(yearData, dutyCounts, holidaySummary.calendarHolidays, holidaySummary.additionalWeekdays),
    [yearData, dutyCounts, holidaySummary.calendarHolidays, holidaySummary.additionalWeekdays]
  );

  /** 年度切替 — 現在年度を保存してから新年度を読み込む */
  function handleYearChange(newYear: number) {
    if (newYear === currentFiscalYear) return;
    // 現在年度を保存（useEffectでも保存されるが念のため即時保存）
    saveToStorage(yearData, assignments);
    // 新年度のデータを読み込む
    const loaded = loadYear(newYear);
    setCurrentFiscalYear(newYear);
    setYearData(loaded.yearData);
    setAssignments(loaded.assignments);
  }

  function handleAutoAssign() {
    const locked = assignments.filter((a) => a.isLocked);
    setAssignments(generateAssignments(members, yearData, locked));
  }

  function handleAssignmentToggle(date: string, memberId: string) {
    const isAlreadyAssigned = assignments.some(
      (a) => a.date === date && a.memberId === memberId && a.type !== "marathon"
    );

    if (isAlreadyAssigned) {
      // 選択解除: そのメンバーのみ削除（他の日は変更しない）
      setAssignments(
        assignments.filter(
          (a) => !(a.date === date && a.memberId === memberId && a.type !== "marathon")
        )
      );
    } else {
      // 選択追加: 同じ日の既存アサインをロック済みにした上で追加（自動再割り振り時も保持）
      const withLockedExisting = assignments.map((a) =>
        a.date === date && a.type !== "marathon" ? { ...a, isLocked: true } : a
      );
      setAssignments([
        ...withLockedExisting,
        { date, memberId, type: "manual" as const, isLocked: true },
      ]);
    }
  }

  function handleUnlock(date: string) {
    const remaining = assignments.filter((a) => a.date !== date);
    const locked = remaining.filter((a) => a.isLocked);
    setAssignments(generateAssignments(members, yearData, locked));
  }

  function handleSaveSettings(updated: YearData) {
    setYearData(updated);
    // marathon assignments are always regenerated from marathonDate — exclude them from locked
    const locked = assignments.filter((a) => a.isLocked && a.type !== "marathon");
    setAssignments(generateAssignments(members, updated, locked));
  }

  function handleImport(file: File) {
    importJSON(file)
      .then((data) => {
        const importedYear = data.yearData.fiscalYear;
        setCurrentFiscalYear(importedYear);
        setYearData(data.yearData);
        setAssignments(data.assignments);
        saveToStorage(data.yearData, data.assignments);
      })
      .catch((err) => alert(err.message));
  }

  function handleGasUrlChange(url: string) {
    setGasUrl(url);
    saveGasUrl(url);
  }

  async function handleCloudPush() {
    try {
      saveToStorage(yearData, assignments);
      await cloudPushAll(gasUrl);
      alert("クラウドへ保存しました");
    } catch (err) {
      alert(`保存に失敗しました: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function handleCloudPull() {
    try {
      await cloudPullAll(gasUrl);
      const loaded = loadYear(currentFiscalYear);
      setYearData(loaded.yearData);
      setAssignments(loaded.assignments);
      alert("クラウドから読み込みました");
    } catch (err) {
      alert(`読込に失敗しました: ${err instanceof Error ? err.message : err}`);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header
        yearData={yearData}
        onAutoAssign={handleAutoAssign}
        hasAssignments={assignments.length > 0}
        onOpenSettings={() => setShowSettings(true)}
        onPrint={() => window.print()}
        onYearChange={handleYearChange}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 print:p-0 print:max-w-none">
        {/* ビュー切替タブ */}
        <div className="print:hidden inline-flex bg-gray-100 rounded-2xl p-1.5 gap-1.5 mb-6 shadow-inner">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-base font-bold transition-all duration-200 cursor-pointer ${
              viewMode === "calendar"
                ? "bg-white text-brand-700 shadow-md"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            月カレンダー
          </button>
          <button
            onClick={() => setViewMode("yearly")}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-base font-bold transition-all duration-200 cursor-pointer ${
              viewMode === "yearly"
                ? "bg-white text-brand-700 shadow-md"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            年間一覧
          </button>
        </div>

        {/* メンバーレジェンドバー（月カレンダー時のみ） */}
        <div className={viewMode === "yearly" ? "hidden" : "print:hidden"}>
          <MemberLegendBar
            members={members}
            dutyCounts={dutyCounts}
            individualHolidays={individualHolidays}
            hasAssignments={assignments.length > 0}
          />
        </div>

        {viewMode === "calendar" ? (
          <>
            {/* 印刷時タイトル（月カレンダー） */}
            <div className="hidden print:block mb-4">
              <h1 className="text-lg font-bold">
                スイテック 休日当番シフト — {yearData.fiscalYear}年度
              </h1>
            </div>

            {/* 2カラムレイアウト（印刷時は1カラム） */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 print:grid-cols-1 print:mt-0">
              <Calendar
                assignments={assignments}
                members={members}
                holidays={yearData.holidays}
                holidayPeriods={yearData.holidayPeriods}
                companyWorkDays={yearData.companyWorkDays}
                onAssignmentToggle={handleAssignmentToggle}
                onUnlock={handleUnlock}
                fiscalYear={currentFiscalYear}
              />
              <div className="print:hidden">
                <SummaryPanel
                  members={members}
                  dutyCounts={dutyCounts}
                  individualHolidays={individualHolidays}
                  nextRotation={nextRotation}
                  holidaySummary={holidaySummary}
                  yearData={yearData}
                  assignments={assignments}
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <YearlyView
              assignments={assignments}
              members={members}
              yearData={yearData}
            />
          </div>
        )}

      </main>

      {/* 設定モーダル */}
      {showSettings && (
        <SettingsModal
          yearData={yearData}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onExport={() => exportJSON(yearData, assignments)}
          onImport={handleImport}
          gasUrl={gasUrl}
          onGasUrlChange={handleGasUrlChange}
          onCloudPush={handleCloudPush}
          onCloudPull={handleCloudPull}
        />
      )}
    </div>
  );
}

export default App;
