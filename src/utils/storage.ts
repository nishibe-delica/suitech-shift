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

// ━━ クラウド同期（Google Apps Script 経由） ━━

const GAS_URL_KEY = "suitech-shift-gas-url";

export function saveGasUrl(url: string) {
  localStorage.setItem(GAS_URL_KEY, url);
}

export function loadGasUrl(): string {
  return localStorage.getItem(GAS_URL_KEY) ?? "";
}

/** 全年度データをクラウドへ保存（no-cors で POST） */
export async function cloudPushAll(gasUrl: string): Promise<void> {
  const allData: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      const raw = localStorage.getItem(key);
      if (raw) allData[key] = JSON.parse(raw);
    }
  }
  await fetch(gasUrl, {
    method: "POST",
    mode: "no-cors", // Apps Script の 302 リダイレクトを回避
    body: JSON.stringify(allData),
  });
}

/** クラウドから全年度データを取得して localStorage へ書き込む */
export async function cloudPullAll(gasUrl: string): Promise<void> {
  const res = await fetch(`${gasUrl}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`サーバーエラー: HTTP ${res.status}`);
  const allData = await res.json() as Record<string, unknown>;
  if (Object.keys(allData).length === 0) throw new Error("クラウドにデータがありません");
  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

// ━━ JSON バックアップ ━━

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
