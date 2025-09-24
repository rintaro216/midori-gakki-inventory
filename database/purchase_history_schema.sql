-- 仕入れ履歴管理テーブル
-- このSQLをSupabaseのSQL Editorで実行してください

CREATE TABLE purchase_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,

  -- 基本仕入情報
  purchase_date DATE NOT NULL,
  purchase_price INTEGER NOT NULL, -- 実際の仕入価格
  supplier VARCHAR(255) NOT NULL, -- 仕入先名

  -- 請求書情報
  invoice_number VARCHAR(100), -- 請求書番号
  invoice_date DATE, -- 請求書発行日
  invoice_file_path TEXT, -- 請求書ファイルのパス（アップロードした場合）

  -- 支払い情報
  payment_status VARCHAR(20) DEFAULT '未払い' CHECK (payment_status IN ('未払い', '支払済み', '部分支払い')),
  payment_date DATE, -- 支払完了日
  payment_method VARCHAR(50), -- 支払方法（現金、振込、クレジット等）

  -- 商品詳細
  product_condition_at_purchase VARCHAR(50), -- 仕入時の商品状態
  quantity INTEGER DEFAULT 1, -- 数量

  -- メタ情報
  notes TEXT, -- 備考
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_purchase_history_inventory_id ON purchase_history(inventory_id);
CREATE INDEX idx_purchase_history_purchase_date ON purchase_history(purchase_date);
CREATE INDEX idx_purchase_history_supplier ON purchase_history(supplier);
CREATE INDEX idx_purchase_history_payment_status ON purchase_history(payment_status);

-- updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_history_updated_at
    BEFORE UPDATE ON purchase_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 仕入先マスタテーブル（よく使う仕入先の管理用）
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  payment_terms VARCHAR(100), -- 支払条件
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サンプルデータ挿入
INSERT INTO suppliers (name, contact_person, phone, email, payment_terms) VALUES
('山野楽器', '田中太郎', '03-1234-5678', 'tanaka@yamano.co.jp', '月末締め翌月末払い'),
('楽器センター', '佐藤花子', '06-9876-5432', 'sato@gakki-center.co.jp', '現金払い'),
('ミュージックストア', '鈴木次郎', '052-1111-2222', 'suzuki@musicstore.co.jp', '月末締め翌々月10日払い');

COMMENT ON TABLE purchase_history IS '仕入れ履歴管理テーブル';
COMMENT ON TABLE suppliers IS '仕入先マスタテーブル';