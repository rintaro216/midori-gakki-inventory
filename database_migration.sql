-- 仕入れ管理機能のためのデータベースマイグレーション
-- Supabaseダッシュボードで実行してください

-- 仕入れ日フィールドを追加
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_date DATE;

-- 仕入れ価格フィールドを追加
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_price INTEGER;

-- 利益率フィールドを追加（パーセンテージ）
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2);

-- 利益額フィールドを追加
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS profit_amount INTEGER;

-- 在庫日数フィールドを追加
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS days_in_stock INTEGER;

-- コメント追加
COMMENT ON COLUMN inventory.purchase_date IS '仕入れ日';
COMMENT ON COLUMN inventory.purchase_price IS '仕入れ価格（円）';
COMMENT ON COLUMN inventory.profit_margin IS '利益率（％）';
COMMENT ON COLUMN inventory.profit_amount IS '利益額（円）';
COMMENT ON COLUMN inventory.days_in_stock IS '在庫日数';

-- 利益率と利益額を自動計算するビューを作成
CREATE OR REPLACE VIEW inventory_with_calculations AS
SELECT
  *,
  CASE
    WHEN purchase_price IS NOT NULL AND purchase_price > 0 THEN
      ROUND(((price - purchase_price)::DECIMAL / price::DECIMAL) * 100, 2)
    ELSE NULL
  END AS calculated_profit_margin,

  CASE
    WHEN purchase_price IS NOT NULL THEN
      price - purchase_price
    ELSE NULL
  END AS calculated_profit_amount,

  CASE
    WHEN purchase_date IS NOT NULL THEN
      CURRENT_DATE - purchase_date
    ELSE NULL
  END AS calculated_days_in_stock
FROM inventory;