-- 在庫テーブルに仕入れ情報フィールドを追加
-- このSQLをSupabaseのSQL Editorで実行してください

-- 在庫テーブルに仕入れ関連フィールドを追加
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_price INTEGER;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT '未払い' CHECK (payment_status IN ('未払い', '支払済み', '部分支払い'));
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS profit_amount INTEGER;

-- インデックスを追加（検索・ソート性能向上）
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_date ON inventory(purchase_date);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_price ON inventory(purchase_price);
CREATE INDEX IF NOT EXISTS idx_inventory_payment_status ON inventory(payment_status);
CREATE INDEX IF NOT EXISTS idx_inventory_profit_margin ON inventory(profit_margin);

-- コメントを追加
COMMENT ON COLUMN inventory.purchase_date IS '仕入日';
COMMENT ON COLUMN inventory.purchase_price IS '仕入価格';
COMMENT ON COLUMN inventory.invoice_number IS '請求書番号';
COMMENT ON COLUMN inventory.invoice_date IS '請求書発行日';
COMMENT ON COLUMN inventory.payment_status IS '支払い状況';
COMMENT ON COLUMN inventory.payment_date IS '支払日';
COMMENT ON COLUMN inventory.payment_method IS '支払方法';
COMMENT ON COLUMN inventory.profit_margin IS '利益率（%）';
COMMENT ON COLUMN inventory.profit_amount IS '利益額（円）';

-- 既存データの利益率・利益額を自動計算（仕入価格があるもののみ）
UPDATE inventory
SET
  profit_margin = CASE
    WHEN purchase_price IS NOT NULL AND purchase_price > 0 AND price > 0
    THEN ROUND(((price - purchase_price)::DECIMAL / price::DECIMAL * 100), 2)
    ELSE NULL
  END,
  profit_amount = CASE
    WHEN purchase_price IS NOT NULL AND purchase_price > 0 AND price > 0
    THEN price - purchase_price
    ELSE NULL
  END
WHERE purchase_price IS NOT NULL AND purchase_price > 0;