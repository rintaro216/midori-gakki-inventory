# みどり楽器 在庫管理システム 詳細設計書

## 📋 システム概要

### システム名
みどり楽器在庫管理システム

### 核心的な目的
楽器店「みどり楽器」における**大量商品の効率的な一括登録**と在庫管理
- **主要要件**: 20-30商品を一度に処理できる大量登録機能
- **重要**: 単品登録ではなく、多品目一括登録が基本機能

### 完全な技術スタック詳細

#### フロントエンド
- **Next.js**: 15.5.3 (App Router使用)
- **React**: 18
- **TypeScript**: 厳密な型定義
- **ビルドツール**: Turbopack (Next.js 15の新機能)
- **スタイリング**: Tailwind CSS
- **状態管理**: React useState/useEffect (追加ライブラリなし)

#### バックエンド・データベース
- **データベース**: Supabase (PostgreSQL) - クラウドホスティング
- **API**: Next.js API Routes (`/api/*`)
- **認証**: 現在未実装（Supabaseで将来実装可能）

#### 外部ライブラリ・依存関係
- **CSV処理**: `papaparse` - CSVファイルの解析・生成
- **PDF処理**: **現在モック** - 将来的に`pdf-parse`または`pdfjs-dist`
- **OCR処理**: **現在モック** - 将来的に`tesseract.js`またはクラウドOCR API
- **Excel出力**: カスタム実装（CSV形式）

#### 開発環境
- **開発サーバー**: http://localhost:3000
- **Node.js**: v18以上推奨
- **Package Manager**: npm

---

## 🏗️ 詳細システム構成

### ディレクトリ構造
```
D:/claude/みどり楽器　商品整理/midori-inventory/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # ダッシュボード
│   │   ├── inventory/
│   │   │   ├── page.tsx              # 在庫一覧
│   │   │   ├── add/page.tsx          # 単品登録（補助機能）
│   │   │   └── bulk-import/page.tsx  # 多品目一括登録（メイン機能）
│   │   └── api/                      # API Routes
│   │       ├── csv-import/route.ts   # CSV一括インポート（実装済み）
│   │       ├── pdf-extract/route.ts  # 単一PDF（モック）
│   │       ├── multiple-pdf-extract/route.ts  # 多品目PDF（モック）
│   │       ├── ocr/route.ts          # 単一OCR（未実装）
│   │       └── multiple-ocr/route.ts # 多品目OCR（モック）
│   ├── components/                   # Reactコンポーネント
│   │   ├── CSVImport.tsx            # 単純CSV読み込み
│   │   ├── CSVBulkRegister.tsx      # 大量CSV登録（重要）
│   │   ├── PDFExtractor.tsx         # 単一PDF抽出
│   │   ├── MultiplePDFExtractor.tsx # 多品目PDF抽出（重要）
│   │   ├── ImageOCR.tsx             # 単一画像OCR
│   │   ├── MultipleImageOCR.tsx     # 多品目画像OCR（重要）
│   │   └── ...
│   ├── lib/
│   │   └── supabase.ts              # Supabase設定
│   └── utils/
│       └── exportUtils.ts           # CSV/Excel出力ユーティリティ
├── .env.local                       # Supabase接続情報
├── package.json                     # 依存関係定義
└── next.config.js                   # Next.js設定
```

---

## 📊 データベース設計（Supabase）

### `inventory` テーブル詳細設計

```sql
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(50) NOT NULL,                    -- カテゴリ（必須）
  product_name VARCHAR(255) NOT NULL,               -- 商品名（必須）
  manufacturer VARCHAR(100) NOT NULL,               -- メーカー・ブランド（必須）
  model_number VARCHAR(100) NOT NULL,               -- 型番・シリアル（必須）
  color VARCHAR(50) NOT NULL,                       -- カラー（必須）
  condition VARCHAR(20) NOT NULL,                   -- 状態（必須）
  price INTEGER NOT NULL CHECK (price > 0),         -- 販売価格（必須、正数）
  supplier VARCHAR(100),                            -- 仕入先（任意）
  list_price INTEGER CHECK (list_price > 0),        -- 定価（任意、正数）
  wholesale_price INTEGER CHECK (wholesale_price > 0), -- 卸価格（任意、正数）
  wholesale_rate DECIMAL(5,2),                      -- 卸率（任意、%）
  gross_margin INTEGER,                             -- 粗利（任意、円）
  notes TEXT,                                       -- 備考（任意）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 登録日時
);

-- インデックス（検索パフォーマンス向上）
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_manufacturer ON inventory(manufacturer);
CREATE INDEX idx_inventory_created_at ON inventory(created_at DESC);
```

### カテゴリマスター（ハードコード）
```typescript
const categories = [
  'ギター', 'ベース', 'ドラム', 'キーボード・ピアノ',
  '管楽器', '弦楽器', 'アンプ', 'エフェクター',
  'アクセサリー', 'その他'
]
```

### 状態マスター（ハードコード）
```typescript
const conditions = [
  '新品', '中古', '展示品', 'B級品', 'ジャンク'
]
```

---

## 🚀 **メイン機能: 多品目一括登録システム**

### 設計思想
- **大量処理優先**: 20-30商品を効率的に処理
- **品質保証**: CSV出力→Excel確認→再登録のフロー
- **柔軟性**: PDF・写真・CSV入力に対応

### ページ: `/inventory/bulk-import`

#### ワークフロー詳細
```
ステップ1: データ取得
┌─────────────────────────────────────────┐
│ 入力方法選択                              │
├─────────────────┬─────────────────────┤
│ 📄 PDF読み取り    │ 📷 写真読み取り（複数） │
│ ・請求書PDF      │ ・商品ラベル写真      │
│ ・商品カタログ    │ ・値札写真           │
│ ・1つのPDFから   │ ・複数枚同時処理      │
│  複数商品抽出    │                     │
└─────────────────┴─────────────────────┘
                ↓
ステップ2: データ確認・登録
┌─────────────────────────────────────────┐
│ 読み取り結果確認                          │
├─────────────────┬─────────────────────┤
│ 📊 CSV出力        │ 🚀 直接一括登録      │
│ ・Excel編集可能   │ ・即座にDB登録       │
│ ・人間による確認   │ ・確認なし          │
│ ・再アップロード   │                     │
└─────────────────┴─────────────────────┘
```

### コンポーネント詳細

#### `MultiplePDFExtractor.tsx`
```typescript
interface Product {
  category: string
  product_name: string
  manufacturer: string
  model_number: string
  color: string
  condition: string
  price: string
  supplier?: string
  list_price?: string
  wholesale_price?: string
  wholesale_rate?: string
  gross_margin?: string
  notes?: string
}

// 機能:
// - PDFファイルアップロード
// - /api/multiple-pdf-extract への送信
// - 結果テーブル表示（6列: 商品名、メーカー、型番、価格、カテゴリ、状態）
// - CSV出力ボタン（全13フィールド対応）
```

#### `MultipleImageOCR.tsx`
```typescript
// 機能:
// - 複数画像ファイル選択（multiple属性）
// - 画像プレビュー（グリッド表示）
// - /api/multiple-ocr への送信
// - 結果テーブル表示
// - CSV出力ボタン
```

#### `CSVBulkRegister.tsx`
```typescript
// 機能:
// - 抽出済み商品データの表示
// - 直接一括登録ボタン
// - CSV出力ボタン
// - CSV再アップロード機能
// - /api/csv-import への送信
```

---

## 🔧 API実装状況詳細

### 1. `/api/csv-import` ✅ **実装済み**
```typescript
// 使用ライブラリ: papaparse
// 機能:
// - CSVファイル解析
// - データバリデーション（必須フィールドチェック）
// - 数値変換（価格フィールド）
// - Supabaseへの一括INSERT
// - エラーハンドリング

// 入力: FormData with CSV file
// 出力: { success: boolean, imported: number, message: string }
```

### 2. `/api/multiple-pdf-extract` 🔶 **モック実装**
```typescript
// 現在の状況:
// - モックデータで5商品を返す
// - ファイルアップロードは受信
// - 実際のPDF解析は未実装

// モック商品例:
// 1. YAMAHA FG830 - ¥35,000
// 2. Fender Jazz Bass - ¥85,000
// 3. TAMA スネアドラム - ¥28,000
// 4. CASIO キーボード - ¥18,000
// 5. BOSS エフェクター - ¥8,000

// 将来実装案:
// - pdf-parse または pdfjs-dist
// - Claude API またはGPT-4 Vision API
// - カスタムPDF解析ロジック
```

### 3. `/api/multiple-ocr` 🔶 **モック実装**
```typescript
// 現在の状況:
// - 画像ファイル数に応じてモックデータ生成
// - 実際のOCR処理は未実装

// 将来実装案:
// - tesseract.js (クライアントサイドOCR)
// - Google Vision API
// - AWS Textract
// - Azure Computer Vision
```

### 4. `/api/pdf-extract` 🔶 **モック実装（単一PDF）**
```typescript
// 単品登録用の単一PDF処理
// 現在モック、将来的に上記multiple版と統合可能
```

### 5. `/api/ocr` ❌ **未実装**
```typescript
// 単品登録用の単一画像OCR
// 優先度低（多品目処理を優先）
```

---

## 📈 大量処理能力の詳細

### 現在の処理能力
- **CSV一括登録**: 理論上無制限（メモリ制限まで）
- **PDF多品目**: モックで5商品、実装後は20-30商品想定
- **写真多品目**: モックで画像数分、実装後は10-20商品想定

### パフォーマンス考慮事項
```typescript
// CSVインポート時のバッチ処理
const { error } = await supabase
  .from('inventory')
  .insert(validatedData)  // 配列で一括INSERT

// 大量データ処理時の注意点:
// - Supabaseの1回のクエリ制限
// - ブラウザのメモリ制限
// - ファイルサイズ制限（現在設定なし）
```

### 推奨運用サイズ
- **CSV**: 100商品まで
- **PDF**: 20-30商品まで
- **写真**: 10-20商品まで

---

## 🖥️ UI/UX設計詳細

### レスポンシブ対応
```css
/* Tailwind CSSクラス使用例 */
.grid-cols-1.md:grid-cols-2.lg:grid-cols-4  /* カード表示 */
.overflow-x-auto                            /* テーブル横スクロール */
.flex.flex-wrap.gap-3                       /* ボタン配置 */
```

### カラーテーマ
- **多品目一括登録**: 赤系 (`bg-red-600`)
- **PDF処理**: 緑系 (`bg-green-600`)
- **OCR処理**: 紫系 (`bg-purple-600`)
- **CSV処理**: オレンジ系 (`bg-orange-600`)
- **Excel出力**: 紫系 (`bg-purple-600`)

---

## ⚠️ 制限事項・課題

### 技術的制限
1. **PDF処理**: 実装待ち（現在モック）
2. **OCR処理**: 実装待ち（現在モック）
3. **認証機能**: 未実装
4. **ファイルサイズ制限**: 設定なし
5. **エラーログ**: 基本的なconsole.logのみ

### 運用上の制限
1. **同時ユーザー**: 考慮なし（単一ユーザー想定）
2. **データバックアップ**: Supabase依存
3. **商品編集**: 未実装（登録のみ）
4. **在庫数管理**: 未実装

---

## 🔍 デバッグ・開発情報

### 開発サーバー起動
```bash
cd "D:/claude/みどり楽器　商品整理/midori-inventory"
npm run dev
# → http://localhost:3000
```

### 重要な環境変数（.env.local）
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### デバッグ用URL
- 在庫一覧: http://localhost:3000/inventory
- 多品目一括: http://localhost:3000/inventory/bulk-import
- 単品登録: http://localhost:3000/inventory/add

### ログ確認
```bash
# サーバーサイドログ
# → ターミナルのnpm run dev出力

# クライアントサイドログ
# → ブラウザのDevToolsコンソール
```

---

## 📊 データフロー図

```mermaid
graph TD
    A[ユーザー] --> B{登録方法選択}

    B -->|大量商品| C[多品目一括登録]
    B -->|単一商品| D[単品登録]

    C --> E{入力方法}
    E -->|PDF| F[MultiplePDFExtractor]
    E -->|写真| G[MultipleImageOCR]
    E -->|CSV| H[CSVBulkRegister]

    F --> I[/api/multiple-pdf-extract]
    G --> J[/api/multiple-ocr]

    I --> K[商品データ配列]
    J --> K

    K --> L[CSV出力 or 直接登録]
    L -->|CSV出力| M[Excel編集]
    L -->|直接登録| N[/api/csv-import]

    M --> O[CSV再アップロード]
    O --> N
    H --> N

    N --> P[(Supabase)]

    D --> Q[手動入力フォーム]
    Q --> R[単品登録API]
    R --> P
```

---

---

## ⚠️ **重要な補足・懸念事項**

### 1. **CSV Import APIの致命的なエラー**
```
サーバーログより:
POST /api/csv-import/ 500 in 1551ms
POST /api/csv-import/ 500 in 710ms
```
**問題**: CSV一括登録（メイン機能）が現在動作していない
**影響**: 多品目登録のワークフローが完全に機能しない
**緊急度**: 🔴 **最高** - システムの核心機能

### 2. **Supabase接続の不安定性**
- 環境変数（.env.local）の設定問題の可能性
- Supabaseクライアント設定の確認が必要
- ネットワーク接続またはAPI制限の可能性

### 3. **モック依存の危険性**
現在、以下の機能がモックのため**実用不可**:
```
📄 PDF処理: モックデータ5商品 → 実際のPDF読み取り不可
📷 OCR処理: モックデータ → 実際の画像読み取り不可
```
**実質的な運用**: CSVアップロードのみが唯一の大量登録手段

### 4. **データ整合性の課題**
```typescript
// 自動計算フィールドの不整合リスク
wholesale_rate: 定価と卸価格から自動計算
gross_margin: 販売価格 - 卸価格

// 問題: CSV入力時とフォーム入力時で計算ロジックが異なる可能性
```

### 5. **エラーハンドリングの不備**
- API エラー時のユーザー通知が不十分
- 大量データ処理時のタイムアウト未考慮
- ファイルサイズ制限なし → メモリ不足の危険性

---

## 🔧 **緊急対応が必要な修正項目**

### 最優先（システム動作に必須）
1. **CSV Import APIの修復** - 500エラーの原因調査・修正
2. **Supabase接続の安定化** - 環境設定の確認
3. **エラーログの詳細化** - デバッグ情報の充実

### 高優先（実用性向上）
1. **ファイルサイズ制限の実装** - 10MB程度
2. **データバリデーションの強化** - 型安全性の向上
3. **タイムアウト処理の実装** - 大量データ処理対応

### 中優先（UX改善）
1. **進行状況表示** - 大量データ処理時のプログレスバー
2. **プレビュー機能** - 登録前のデータ確認
3. **ロールバック機能** - 登録失敗時の復旧

---

## 📊 **実際の運用シナリオと課題**

### 現実的な運用フロー（2024年9月現在）
```
1. 手動でExcelに商品データ入力 ✏️
2. CSVとして保存 💾
3. システムにCSVアップロード ⚠️ (エラー発生中)
4. 手動で一品ずつ登録 😞 (非効率的な回避策)
```

### 理想的な運用フロー（修正後）
```
1. 請求書PDFをアップロード 📄
2. AI自動読み取り → 商品データ抽出 🤖
3. CSV出力してExcelで確認・編集 📊
4. 確認済みCSVを再アップロード ✅
5. 20-30商品を一括登録完了 🎉
```

### ビジネスインパクト
- **現状**: PDF/OCRが使えず、CSV登録もエラー → **手動入力のみ**
- **目標**: 1時間で30商品登録 → **現在は1商品5分 = 30商品で2.5時間**
- **改善効果**: **約60%の時間短縮**が期待される

---

## 🔍 **デバッグ・トラブルシューティング**

### CSV Import エラーの調査手順
```bash
# 1. サーバーログの詳細確認
npm run dev
# → POST /api/csv-import/ のエラー詳細をチェック

# 2. Supabase接続テスト
# → src/lib/supabase.ts の設定確認

# 3. 環境変数確認
# → .env.local ファイルの存在と内容確認
```

### よくある問題と解決策
```typescript
// 問題1: Supabase URL/Key が無効
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

// 問題2: CSVフォーマット不一致
// → papaparse の設定確認

// 問題3: データベース制約違反
// → 必須フィールドの欠損チェック
```

---

## 🚨 **リスク分析**

### 技術的リスク
| リスク | 確率 | 影響度 | 対策 |
|--------|------|--------|------|
| CSV API継続エラー | 高 | 致命的 | 緊急修正 |
| Supabase接続不安定 | 中 | 高 | 接続設定見直し |
| モック依存の長期化 | 高 | 中 | AI機能実装計画 |

### 運用リスク
| リスク | 確率 | 影響度 | 対策 |
|--------|------|--------|------|
| 大量データ処理失敗 | 中 | 高 | バッチ処理実装 |
| データ重複登録 | 低 | 中 | 重複チェック機能 |
| ユーザー操作ミス | 高 | 低 | UI改善・確認画面 |

---

## 💡 **推奨する次のアクション**

### 即座に実行すべき（今日中）
1. **CSV Import API のデバッグ** - エラー原因の特定
2. **Supabase接続状況の確認** - 環境設定チェック
3. **最小限のCSVテスト** - 1商品での動作確認

### 短期間で実行すべき（1週間以内）
1. **エラーハンドリングの改善** - ユーザーフレンドリーなエラーメッセージ
2. **ファイルアップロード制限** - セキュリティ向上
3. **データバリデーション強化** - 品質保証

### 中長期で実行すべき（1ヶ月以内）
1. **PDF解析機能の実装** - 実用的なAI機能
2. **OCR機能の実装** - 画像読み取り
3. **パフォーマンス最適化** - 大量データ処理

---

*この設計書は現在の実装状況を正確に反映しており、**重要な問題点と緊急対応事項**を含めて、新しい開発者が引き継ぎ開発を行うために必要な技術情報を網羅しています。*