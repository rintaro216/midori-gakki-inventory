-- 在庫管理テーブル
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  model_number VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL,
  photo_url TEXT,
  notes TEXT
);

-- Row Level Security (RLS) を有効化
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーのみアクセス可能にするポリシー
CREATE POLICY "Enable all operations for authenticated users" ON inventory
  FOR ALL USING (auth.role() = 'authenticated');

-- インデックスを作成（検索パフォーマンス向上のため）
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_manufacturer ON inventory(manufacturer);
CREATE INDEX idx_inventory_color ON inventory(color);
CREATE INDEX idx_inventory_price ON inventory(price);