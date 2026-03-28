import type { Assignment, YearData } from "../types";

const STORAGE_KEY_PREFIX = "suitech-shift-v1-fy";

interface StorageData {
  yearData: YearData;
  assignments: Assignment[];
}

export function saveToStorage(yearData: YearData, assignments: Assignment[]) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${yearData.fiscalYear}`;
    const data: StorageData = { yearData, assignments };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.warn("localStorage save failed");
  }
}

export function loadFromStorage(fiscalYear: number): StorageData | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${fiscalYear}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(raw) as any;
    // マイグレーション: specialLeaves → holidayPeriods
    if (data.yearData && data.yearData.specialLeaves !== undefined && !data.yearData.holidayPeriods) {
      data.yearData.holidayPeriods = [];
      delete data.yearData.specialLeaves;
    }
    if (data.yearData && !data.yearData.holidayPeriods) {
      data.yearData.holidayPeriods = [];
    }
    return data as StorageData;
  } catch {
    return null;
  }
}

export function exportJSON(yearData: YearData, assignments: Assignment[]) {
  const data: StorageData = { yearData, assignments };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `suitech-shift-${yearData.fiscalYear}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file: File): Promise<StorageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as StorageData;
        resolve(data);
      } catch {
        reject(new Error("JSONの解析に失敗しました"));
      }
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsText(file);
  });
}
