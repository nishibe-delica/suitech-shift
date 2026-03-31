import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ShiftRow {
  id?: number;
  fiscal_year: number;
  year_data: object;
  assignments: object[];
  updated_at?: string;
}

/** Supabaseから指定年度データを読み込む */
export async function loadFromSupabase(fiscalYear: number): Promise<{ yearData: object; assignments: object[] } | null> {
  const { data, error } = await supabase
    .from("shifts")
    .select("year_data, assignments, updated_at")
    .eq("fiscal_year", fiscalYear)
    .single();

  if (error || !data) return null;
  return { yearData: data.year_data, assignments: data.assignments };
}

/** Supabaseへデータを保存（管理者のみ） */
export async function saveToSupabase(
  fiscalYear: number,
  yearData: object,
  assignments: object[]
): Promise<boolean> {
  const { error } = await supabase.from("shifts").upsert(
    { fiscal_year: fiscalYear, year_data: yearData, assignments, updated_at: new Date().toISOString() },
    { onConflict: "fiscal_year" }
  );
  return !error;
}

/** ログイン */
export async function adminSignIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

/** ログアウト */
export async function adminSignOut() {
  await supabase.auth.signOut();
}

/** 現在のセッションを取得 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
