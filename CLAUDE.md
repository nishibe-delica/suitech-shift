# スイテック 休日当番シフト管理システム

## プロジェクト概要

**プロジェクト名**: suitech-shift  
**目的**: スイテック社の休日・祝日当番シフトを自動生成・管理するWebアプリケーション  
**ユーザー**: 社内メンバー（谷脇、三木、西部、山田、佐竹）  
**バージョン**: v0.3.9 (2026-04-06時点)

### 主な機能

- **月カレンダー表示**: 当番割り振りを月単位でビジュアル表示
- **年間一覧ビュー**: 全12ヶ月を月カード形式で一覧表示（印刷対応）
- **自動割り振り**: メンバー間で均等にローテーション（ロック機能付き）
- **手動調整**: 複数人同時割り当て、個別ロック/アンロック
- **特別休暇期間管理**: GW、夏季休暇、年末年始の期間設定・編集
- **揖斐川マラソン対応**: マラソンメンバーのみ自動割り当て
- **年度切替**: 2026年度〜（現在年+4年）まで動的対応
- **印刷機能**: 月カレンダー1枚、年間一覧A4横1枚
- **管理者認証**: Supabase Authによるログイン機能
- **クラウド同期**: Supabaseへの自動保存（管理者のみ）
- **データバックアップ**: JSON形式でエクスポート/インポート

---

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| **フレームワーク** | React | 19.2.4 |
| **言語** | TypeScript | 5.9.3 |
| **ビルドツール** | Vite | 8.0.1 |
| **スタイリング** | Tailwind CSS | 4.2.2 |
| **バックエンド** | Supabase | 2.101.0 |
| **認証** | Supabase Auth | - |
| **データベース** | Supabase (PostgreSQL) | - |
| **デプロイ** | GitHub Pages | - |
| **CI/CD** | GitHub Actions | - |

### 開発ツール

- **Linter**: ESLint 9.39.4 + TypeScript ESLint 8.57.0
- **パッケージマネージャー**: npm
- **Git**: リポジトリ https://github.com/nishibe-delica/suitech-shift.git

---

## プロジェクト構造

```
suitech-shift/
├── src/
│   ├── components/          # Reactコンポーネント
│   │   ├── AdminLoginModal.tsx
│   │   ├── Calendar.tsx     # 月カレンダー表示
│   │   ├── Header.tsx
│   │   ├── MemberDropdown.tsx
│   │   ├── MemberLegendBar.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── SummaryPanel.tsx
│   │   └── YearlyView.tsx   # 年間一覧表示
│   ├── data/                # 静的データ
│   │   ├── holidays2026.ts  # 2026年度祝日データ
│   │   ├── holidays2027.ts  # 2027年度祝日データ
│   │   ├── members.ts       # メンバー定義
│   │   └── yearDefaults.ts  # 年度デフォルト設定
│   ├── types/
│   │   └── index.ts         # TypeScript型定義
│   ├── utils/
│   │   ├── assignment.ts    # 割り振りロジック
│   │   ├── calendar.ts      # 日付ユーティリティ
│   │   ├── storage.ts       # localStorage管理
│   │   └── supabase.ts      # Supabase接続
│   ├── App.tsx              # メインコンポーネント
│   └── main.tsx             # エントリーポイント
├── public/                  # 静的ファイル
├── .github/workflows/       # GitHub Actions
│   └── deploy.yml           # 自動デプロイ設定
├── .env.local               # Supabase環境変数（gitignore）
├── PROGRESS.md              # 作業進捗メモ
├── vite.config.ts           # Vite設定
└── package.json             # 依存関係
```

---

## データモデル

### Member（メンバー情報）

```typescript
interface Member {
  id: string;              // 一意識別子（例: "taniwaki"）
  name: string;            // 表示名（例: "谷脇"）
  color: string;           // カレンダー表示色（例: "#E6F1FB"）
  order: number;           // 表示順序
  active: boolean;         // アクティブ状態
  isMarathonMember: boolean; // マラソン当番対象か
  isFixed?: boolean;       // ローテーション対象外か（佐竹さん用）
}
```

**現在のメンバー**:
- 谷脇 (`taniwaki`): マラソン非対象
- 三木 (`miki`): マラソン対象
- 西部 (`nishibe`): マラソン対象
- 山田 (`yamada`): マラソン対象
- 佐竹 (`satake`): **固定メンバー（ローテーション対象外、isFixed: true）**

### YearData（年度データ）

```typescript
interface YearData {
  fiscalYear: number;                  // 年度（例: 2026）
  startDate: string;                   // 開始日（例: "2026-04-01"）
  endDate: string;                     // 終了日（例: "2027-03-31"）
  holidays: { date: string; name: string }[]; // 祝日一覧
  assignments: Assignment[];           // 割り振りデータ
  holidayPeriods: HolidayPeriod[];     // 特別休暇期間
  companyWorkDays?: string[];          // 廃止（後方互換性のみ）
  marathonDate: string | null;         // 揖斐川マラソン日
  rotationOrder: string[];             // ローテーション順序
}
```

### Assignment（割り振り）

```typescript
interface Assignment {
  date: string;       // 割り当て日（YYYY-MM-DD）
  memberId: string;   // メンバーID
  type: "rotation" | "marathon" | "manual" | "fixed";
  isLocked: boolean;  // ロック済みか（再割り振り時も保持）
}
```

**typeの意味**:
- `rotation`: 自動ローテーション割り振り
- `marathon`: マラソン当番（マラソンメンバーのみ）
- `manual`: 手動割り当て（ユーザーが明示的に設定）
- `fixed`: 固定メンバー（佐竹さん）の自動割り振り

### HolidayPeriod（特別休暇期間）

```typescript
interface HolidayPeriod {
  id: string;           // 一意識別子
  label: string;        // 表示ラベル（例: "GW"）
  start: string;        // 開始日
  end: string;          // 終了日
  noDutyDates: string[]; // 担当制なし（全員休み）の日
}
```

---

## 重要な設計判断とその理由

### 1. 全社出勤日の概念を廃止（v0.3.7）

**変更前**: `companyWorkDays` 配列で全社出勤日を管理し、自動的に全員に割り振り  
**変更後**: 全社出勤日という概念を削除、必要に応じて手動で複数人割り当て

**理由**:
- 全社出勤日が自動で全員に割り振られるが、実際には一部メンバーが休むケースがあった
- 柔軟性を重視し、手動追加方式に変更
- **後方互換性**: `companyWorkDays` はYearDataに残すが、読み込み時に `undefined` で上書き
- **移行処理**: 旧バージョンで自動追加された `type: "manual"` かつ `isLocked: false` の割り振りは読み込み時に自動削除（App.tsx L89）

### 2. 祝日データはコード側を常に正とする（v0.3.3）

**背景**: Supabaseに保存された古い祝日データが誤っているケースがあった

**実装**:
- Supabaseから読み込んだデータの `holidays` フィールドを、常に `getDefaultYearData()` の最新値で上書き（App.tsx L85）
- コード側の `src/data/holidays2026.ts`, `holidays2027.ts` が信頼できる情報源

**副作用**: 祝日データの手動編集は不可（将来的に設定画面で編集可能にする予定）

### 3. 不正な割り振りの自動除去（v0.3.4）

**問題**: 祝日データ修正後、「本来当番日でなくなった日」に割り振りが残っていた

**解決**: `sanitizeAssignments()` 関数で読み込み時に自動除去
- 当番対象日でない日の自動割り振り（`isLocked: false`）を削除
- ロック済み・マラソン当番は保持

### 4. 佐竹さんの扱い（v0.3.1, v0.3.0）

**要件**: 佐竹さんは毎日出勤だが、カレンダー上で他メンバーと同様に表示すると見づらい

**実装**:
- `Member.isFixed: true` を設定
- **ローテーション対象外**: `generateAssignments()` で `!m.isFixed` のメンバーのみローテーション（assignment.ts L79）
- **カレンダー表示**: 詳細パネルに「佐竹さんの休日一覧」として表示（カレンダー本体には表示しない）

### 5. ローテーションロジック

**当番対象日の定義**（`getDutyDays()` in assignment.ts）:
- **特別休暇期間外**: 土曜日 + 平日祝日のみ
- **特別休暇期間内**: 日曜以外の全日（`noDutyDates` に含まれる日は除外）
- **常に除外**: 日曜日は当番なし

**割り振りアルゴリズム**:
1. ロック済み割り振りは保持
2. マラソン日にマラソンメンバーを割り当て（`isMarathonMember: true`）
3. 残り当番日を `rotationOrder` 順に順番に割り当て
4. 各メンバーの当番回数がなるべく均等になるようラウンドロビン方式

### 6. Supabase自動保存（v0.3.8, v0.3.9）

**実装**:
- `yearData` または `assignments` 変更時に自動保存（App.tsx L103-112）
- **重要**: Supabase読み込み完了前は保存しない（`supabaseLoaded` フラグで制御）
  - 理由: 読み込み前に保存すると、古いデータでSupabaseを上書きしてしまう
- 管理者ログイン時のみSupabaseに保存、非管理者はlocalStorageのみ

**DBスキーマ** (`shifts` テーブル):
```sql
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  fiscal_year INTEGER UNIQUE NOT NULL,
  year_data JSONB NOT NULL,
  assignments JSONB[] NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

---

## デプロイ環境

### GitHub Pages

**URL**: https://nishibe-delica.github.io/suitech-shift/  
**ブランチ**: `main`  
**ビルドパス**: `/suitech-shift/` (vite.config.ts L6で設定)

**自動デプロイ**:
- `.github/workflows/deploy.yml` でmainブランチへのpushで自動デプロイ
- GitHub Secretsに `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` を設定済み

### Supabase

**プロジェクトURL**: https://vxgzljufrccqziyxqcra.supabase.co  
**接続情報**: `.env.local` に保存（gitignore対象）

**環境変数** (.env.local):
```
VITE_SUPABASE_URL=https://vxgzljufrccqziyxqcra.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**認証方式**: Email/Password  
**管理者ログイン**: アプリ内「管理者ログイン」ボタンから（メールアドレス・パスワードはSupabase Authで管理）

---

## 開発履歴

### v0.3.9 (2026-04-06)
- Supabase読み込み時に旧全社出勤日の `manual` 割り振りを自動除去

### v0.3.8 (2026-04-06)
- リセットバグ修正
- Supabase上の古い `companyWorkDays` をクリア

### v0.3.7 (2026-04-06)
- **全社出勤日の概念を廃止**、手動追加方式に変更

### v0.3.6 (2026-04-02)
- 完全リセットボタンを追加
- 再割り振りのUX改善

### v0.3.5 (2026-04-02)
- 再割り振り時にロック済み処理を選択できるよう改善

### v0.3.4 (2026-04-02)
- **祝日修正後の不正割り振りを読み込み時に自動除去**

### v0.3.3 (2026-04-02)
- **祝日データをDB上書きせずコード側を常に正とする**

### v0.3.2 (2026-04-02)
- 祝日データ修正
- ローテーションインジケーター改善

### v0.3.1 (2026-03-31)
- **佐竹さんをカレンダーから非表示→詳細パネルに休日一覧表示**

### v0.3.0 (2026-03-31)
- **佐竹さんB案実装（isFixed導入）**
- 均等化機能削除
- 全社出勤日ロジック修正

### v0.2.0 (2026-03-31)
- **Supabase DB連携・管理者ログイン機能を追加**

### v0.1.x (2026-03-29)
- 年間一覧ビュー追加
- 印刷対応（A41枚）
- 年度動的生成
- 特別休暇期間編集
- 複数人手動選択機能

---

## ローカル開発環境セットアップ

### 前提条件

- Node.js 20.x以上
- npm
- Git

### 初回セットアップ

```bash
# リポジトリクローン
git clone https://github.com/nishibe-delica/suitech-shift.git
cd suitech-shift

# 依存関係インストール
npm install

# 環境変数設定（.env.localを作成）
echo "VITE_SUPABASE_URL=https://vxgzljufrccqziyxqcra.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=<ANON_KEY>" >> .env.local
# ※ ANON_KEYは既存の.env.localから取得するか、Supabaseダッシュボードから取得

# 開発サーバー起動
npm run dev
```

### 開発コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm run build    # プロダクションビルド（dist/に出力）
npm run preview  # ビルド結果をプレビュー
npm run lint     # ESLint実行
```

### デバッグ時の注意点

- **ブラウザ開発者ツール**: localStorage確認（Application > Local Storage）
- **Supabase接続エラー**: `.env.local` の環境変数を確認
- **認証エラー**: Supabaseダッシュボードでユーザー確認
- **ビルドエラー**: `npm ci` で依存関係をクリーンインストール

---

## 既知のバグ・注意事項

### 現在の既知のバグ

（特になし - 最新バージョンで主要バグは修正済み）

### 注意事項

1. **祝日データは手動編集不可**
   - コード側（`holidays2026.ts`, `holidays2027.ts`）が正
   - 祝日を追加・修正する場合はコードを編集してデプロイ

2. **2028年度以降は祝日データなし**
   - `yearDefaults.ts` で2028年度以降は空の祝日配列
   - 将来的に設定画面で手動設定できるようにする予定

3. **ローカルストレージとSupabaseの整合性**
   - 管理者以外はlocalStorageのみ利用
   - 管理者がログインすると、localStorageとSupabaseが同期される
   - **複数ブラウザで管理者ログインする場合**: 同時編集すると上書きされるため注意

4. **全社出勤日の扱い（廃止後）**
   - v0.3.7以降、全社出勤日は手動で複数人割り当てする必要あり
   - 旧バージョンのデータを読み込むと、自動追加された割り振りは削除される

5. **PowerShellスクリプト（read_satake.ps1, read_satake2.ps1）**
   - プロジェクトルートにあるが、用途不明（おそらく過去の佐竹さんデータ読み込み用）
   - 削除しても問題なし

6. **Excelファイル（satake_schedule.xlsx, satake_tmp.xlsx）**
   - プロジェクトルートにあるが、アプリでは使用していない
   - おそらく過去の手動管理時のファイル
   - 削除してもアプリには影響なし

---

## TODO・未完了タスク

### 次回やること（PROGRESS.mdより）

#### 1. Googleスプレッドシート同期のセットアップ（廃止予定？）

**注意**: v0.3.0以降、Supabase連携に移行したため、この機能は不要になった可能性あり。確認が必要。

過去の手順（参考）:
1. Googleスプレッドシートを新規作成
2. 「拡張機能」→「Apps Script」にスクリプトを貼り付け
3. 「デプロイ」→「新しいデプロイ」→ 種類: ウェブアプリ、アクセス: 全員
4. 発行されたURLをアプリの「データ同期」タブに入力
5. 「クラウドへ保存」で動作確認

#### 2. 2028年度以降の祝日データ追加

- `src/data/holidays2028.ts` を作成
- `yearDefaults.ts` で読み込み
- 内閣府祝日データから取得: https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html

### 将来的な機能改善案

- [ ] 設定画面から祝日を手動編集可能にする
- [ ] メンバー追加・削除をUI上で可能にする
- [ ] ローテーション順序をドラッグ&ドロップで変更
- [ ] カレンダーにメモ機能を追加（例: 「この日は○○のため休み」）
- [ ] 複数年度のデータを一括エクスポート/インポート
- [ ] Supabase Realtime購読で複数管理者の同時編集に対応

---

## よくあるトラブルシューティング

### デプロイ失敗（GitHub Actions）

**症状**: GitHub Actionsでビルドが失敗する

**原因**: 
- 未使用変数がある（例: v0.3.9でYearlyView.tsxの `activeMembers`）
- ESLintエラー

**解決**:
1. ローカルで `npm run build` を実行して確認
2. ESLintエラーを修正
3. 未使用変数を削除

### Supabase接続エラー

**症状**: ログイン失敗、データ保存失敗

**確認ポイント**:
1. `.env.local` が正しく設定されているか
2. Supabaseプロジェクトが停止していないか
3. ANON_KEYが最新か（Supabaseダッシュボードで確認）

### 割り振りが意図しない動作

**症状**: 再割り振りで期待した結果にならない

**確認ポイント**:
1. ロック済み割り振りが意図通りか（ロックを外してから再割り振り）
2. 特別休暇期間の `noDutyDates` 設定を確認
3. メンバーの `active`, `isFixed`, `isMarathonMember` 設定を確認

### ローカルストレージのデータ消失

**症状**: ブラウザを変えたらデータが消えた

**原因**: localStorageはブラウザ・デバイス毎に独立

**解決**:
1. 管理者ログインしてSupabaseから読み込み
2. JSONエクスポート/インポート機能を使う

---

## コードスタイル・規約

### TypeScript

- strictモード有効
- `any` 型の使用は避ける
- インターフェースは `src/types/index.ts` に集約

### React

- 関数コンポーネント使用
- Hooks（useState, useEffect, useMemo）を活用
- propsの型定義は必須

### ファイル命名

- コンポーネント: PascalCase（例: `AdminLoginModal.tsx`）
- ユーティリティ: camelCase（例: `assignment.ts`）
- 定数: UPPER_SNAKE_CASE（例: `INITIAL_FISCAL_YEAR`）

### コミットメッセージ

最近のコミットメッセージの形式:
```
feat: 新機能追加
fix: バグ修正
v0.x.x: バージョンアップ + 変更内容の要約
ci: CI/CD設定変更
```

---

## 参考資料

- **Reactドキュメント**: https://react.dev/
- **Viteドキュメント**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Supabaseドキュメント**: https://supabase.com/docs
- **TypeScript**: https://www.typescriptlang.org/

---

## 連絡先・リポジトリ

- **GitHubリポジトリ**: https://github.com/nishibe-delica/suitech-shift
- **GitHub Pages**: https://nishibe-delica.github.io/suitech-shift/
- **管理者**: nishibe-delica

---

**最終更新**: 2026-04-10
