-- 不足しているカラムをinventoryテーブルに追加
-- Supabaseダッシュボードの「SQL Editor」で実行してください

ALTER TABLE inventory
ADD COLUMN supplier text,
ADD COLUMN list_price bigint,
ADD COLUMN wholesale_price bigint,
ADD COLUMN wholesale_rate double precision,
ADD COLUMN gross_margin bigint;

-- 新しいカラム用のインデックスを作成（検索パフォーマンス向上のため）
CREATE INDEX idx_inventory_supplier ON inventory(supplier);
CREATE INDEX idx_inventory_list_price ON inventory(list_price);
CREATE INDEX idx_inventory_wholesale_price ON inventory(wholesale_price);

-- 確認用クエリ（実行後にテーブル構造を確認）
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'inventory'
-- ORDER BY ordinal_position;