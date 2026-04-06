import { useState, useMemo, useEffect } from "react";
import Header from "./components/Header";
import MemberLegendBar from "./components/MemberLegendBar";
import Calendar from "./components/Calendar";
import SummaryPanel from "./components/SummaryPanel";
import SettingsModal from "./components/SettingsModal";
import YearlyView from "./components/YearlyView";
import AdminLoginModal from "./components/AdminLoginModal";
import { defaultMembers } from "./data/members";
import { getDefaultYearData } from "./data/yearDefaults";
import {
  generateAssignments,
  sanitizeAssignments,
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
} from "./utils/storage";
import {
  supabase,
  loadFromSupabase,
  saveToSupabase,
  adminSignIn,
  adminSignOut,
} from "./utils/supabase";
import type { Assignment, Member, YearData } from "./types";

const INITIAL_FISCAL_YEAR = 2026;

function loadYearLocal(fiscalYear: number): { yearData: YearData; assignments: Assignment[] } {
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
    () => loadYearLocal(INITIAL_FISCAL_YEAR).yearData
  );
  const [assignments, setAssignments] = useState<Assignment[]>(
    () => loadYearLocal(INITIAL_FISCAL_YEAR).assignments
  );
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "yearly">("calendar");

  // 管理者認証
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "loading" | "saved">("idle");

  // 起動時: Supabaseからデータ読込 + セッション確認
  useEffect(() => {
    // セッション確認
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session);
    });

    // 認証状態の変更を監視
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    // Supabaseからデータ読込（全員）
    // 祝日データは常にコード側の最新値で上書き
    // 不正な割り振り（祝日修正で当番日でなくなった日）は自動除去
    loadFromSupabase(INITIAL_FISCAL_YEAR).then((data) => {
      if (data) {
        const yd = data.yearData as YearData;
        const as = data.assignments as Assignment[];
        const canonical = getDefaultYearData(INITIAL_FISCAL_YEAR);
        const merged: YearData = { ...yd, holidays: canonical.holidays };
        const sanitized = sanitizeAssignments(as, merged);
        setYearData(merged);
        setAssignments(sanitized);
        saveToStorage(merged, sanitized);
      }
    });

    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // 管理者のデータ変更時 → Supabase + localStorage に自動保存
  useEffect(() => {
    saveToStorage(yearData, assignments);
    if (isAdmin) {
      setCloudStatus("loading");
      saveToSupabase(currentFiscalYear, yearData, assignments).then((ok) => {
        setCloudStatus(ok ? "saved" : "idle");
        setTimeout(() => setCloudStatus("idle"), 2000);
      });
    }
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
    () => computeIndividualHolidays(dutyCounts, holidaySummary.calendarHolidays, holidaySummary.additionalWeekdays),
    [dutyCounts, holidaySummary.calendarHolidays, holidaySummary.additionalWeekdays]
  );

  async function handleYearChange(newYear: number) {
    if (newYear === currentFiscalYear) return;
    saveToStorage(yearData, assignments);
    // Supabaseから新年度データ取得
    const cloudData = await loadFromSupabase(newYear);
    let loaded: { yearData: YearData; assignments: Assignment[] };
    const canonical = getDefaultYearData(newYear);
    if (cloudData) {
      const yd = cloudData.yearData as YearData;
      const mergedYd: YearData = { ...yd, holidays: canonical.holidays };
      const sanitized = sanitizeAssignments(
        cloudData.assignments as Assignment[],
        mergedYd
      );
      loaded = { yearData: mergedYd, assignments: sanitized };
      saveToStorage(loaded.yearData, loaded.assignments);
    } else {
      loaded = loadYearLocal(newYear);
    }
    setCurrentFiscalYear(newYear);
    setYearData(loaded.yearData);
    setAssignments(loaded.assignments);
  }

  // ロックを保持したまま再割り振り
  function handleAutoAssign() {
    if (!isAdmin) return;
    const locked = assignments.filter((a) => a.isLocked);
    setAssignments(generateAssignments(members, yearData, locked));
  }

  // 全てリセットして均等に再生成
  function handleFullReset() {
    if (!isAdmin) return;
    setAssignments(generateAssignments(members, yearData, []));
  }

  function handleAssignmentToggle(date: string, memberId: string) {
    if (!isAdmin) return;
    const isAlreadyAssigned = assignments.some(
      (a) => a.date === date && a.memberId === memberId && a.type !== "marathon"
    );
    if (isAlreadyAssigned) {
      setAssignments(assignments.filter(
        (a) => !(a.date === date && a.memberId === memberId && a.type !== "marathon")
      ));
    } else {
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
    if (!isAdmin) return;
    const remaining = assignments.filter((a) => a.date !== date);
    const locked = remaining.filter((a) => a.isLocked);
    setAssignments(generateAssignments(members, yearData, locked));
  }

  function handleSaveSettings(updated: YearData) {
    if (!isAdmin) return;
    setYearData(updated);
    const locked = assignments.filter((a) => a.isLocked && a.type !== "marathon");
    setAssignments(generateAssignments(members, updated, locked));
  }

  function handleImport(file: File) {
    if (!isAdmin) return;
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

  async function handleLogin(email: string, password: string): Promise<string | null> {
    const err = await adminSignIn(email, password);
    if (!err) setShowLoginModal(false);
    return err;
  }

  async function handleLogout() {
    await adminSignOut();
    setIsAdmin(false);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header
        yearData={yearData}
        onAutoAssign={handleAutoAssign}
        onFullReset={handleFullReset}
        hasAssignments={assignments.length > 0}
        onOpenSettings={() => setShowSettings(true)}
        onPrint={() => window.print()}
        onYearChange={handleYearChange}
        isAdmin={isAdmin}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        cloudStatus={cloudStatus}
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

        {/* メンバーレジェンドバー */}
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
            <div className="hidden print:block mb-4">
              <h1 className="text-lg font-bold">
                スイテック 休日当番シフト — {yearData.fiscalYear}年度
              </h1>
            </div>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 print:grid-cols-1 print:mt-0">
              <Calendar
                assignments={assignments}
                members={members}
                holidays={yearData.holidays}
                holidayPeriods={yearData.holidayPeriods}
                onAssignmentToggle={handleAssignmentToggle}
                onUnlock={handleUnlock}
                fiscalYear={currentFiscalYear}
                isAdmin={isAdmin}
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
          <YearlyView
            assignments={assignments}
            members={members}
            yearData={yearData}
          />
        )}
      </main>

      {showSettings && isAdmin && (
        <SettingsModal
          yearData={yearData}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onExport={() => exportJSON(yearData, assignments)}
          onImport={handleImport}
        />
      )}

      {showLoginModal && (
        <AdminLoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default App;
