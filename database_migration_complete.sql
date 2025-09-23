-- 仕入れ管理機能対応：inventoryテーブルに必要なカラムを追加
-- Supabaseダッシュボードの「SQL Editor」で実行してください

-- 既存カラムの追加（未実行の場合）
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS supplier text,
ADD COLUMN IF NOT EXISTS list_price bigint,
ADD COLUMN IF NOT EXISTS wholesale_price bigint,
ADD COLUMN IF NOT EXISTS wholesale_rate double precision,
ADD COLUMN IF NOT EXISTS gross_margin bigint;

-- 新しい仕入れ管理カラムの追加
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS purchase_date date,
ADD COLUMN IF NOT EXISTS purchase_price bigint,
ADD COLUMN IF NOT EXISTS profit_margin double precision,
ADD COLUMN IF NOT EXISTS profit_amount bigint;

-- 新しいカラム用のインデックスを作成（検索パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier);
CREATE INDEX IF NOT EXISTS idx_inventory_list_price ON inventory(list_price);
CREATE INDEX IF NOT EXISTS idx_inventory_wholesale_price ON inventory(wholesale_price);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_date ON inventory(purchase_date);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_price ON inventory(purchase_price);

-- 確認用クエリ（実行後にテーブル構造を確認）
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'inventory'
-- ORDER BY ordinal_position;

-- 仕入れ管理関連の統計確認用クエリ
-- SELECT
--   COUNT(*) as total_items,
--   COUNT(purchase_price) as items_with_purchase_price,
--   AVG(profit_margin) as avg_profit_margin,
--   SUM(profit_amount) as total_profit
-- FROM inventory
-- WHERE purchase_price IS NOT NULL AND profit_amount IS NOT NULL;