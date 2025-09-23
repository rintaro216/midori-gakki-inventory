# 請求書フォーマット対応改善計画

## 🚨 現在の懸念点
- 企業ごとの請求書フォーマットの違いに対応できない
- 固定パターンマッチングの限界
- 新しいフォーマットへの適応が困難

## 🎯 推奨改善策

### 1. AI/LLM統合 (最優先)
```typescript
// 例: OpenAI GPT-4を使った柔軟な抽出
const extractWithAI = async (pdfText: string) => {
  const prompt = `
  以下のPDFテキストから楽器の商品情報を抽出してください。
  フォーマット: JSON配列

  必要な情報:
  - category (ギター/ベース/ドラム/キーボード・ピアノ/エフェクター/アンプ/その他)
  - product_name
  - manufacturer
  - model_number
  - color
  - condition (新品/中古/展示品/ジャンク)
  - price (数値のみ)

  テキスト:
  ${pdfText}
  `

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  })

  return JSON.parse(response.choices[0].message.content)
}
```

### 2. 複数フォーマット対応システム
```typescript
// フォーマット検出とテンプレート適用
const detectFormat = (text: string) => {
  const patterns = {
    'yamaha_invoice': /ヤマハ.*請求書/,
    'island_invoice': /島村楽器.*明細/,
    'generic_table': /品名.*数量.*単価/
  }

  for (const [format, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return format
  }
  return 'generic'
}
```

### 3. 学習機能の実装
- ユーザーが修正した結果を学習
- 新しいフォーマットを自動認識
- 精度の継続的向上

### 4. フィードバックシステム
- 抽出結果の正確性をユーザーが評価
- 間違いを修正して学習データに活用
- フォーマット別の成功率を追跡

## 🚀 実装の優先順位

1. **OpenAI API統合** (即効性高)
2. **フォーマット検出システム** (中期)
3. **学習機能** (長期)
4. **OCR処理改善** (並行)

## 📊 期待される効果

- **抽出精度**: 60% → 90%+
- **対応フォーマット**: 5種類 → 50種類+
- **運用工数**: 50%削減
- **新フォーマット適応**: 即座に対応可能

## 💰 コスト概算

- OpenAI API: 月額$50-100 (処理量次第)
- 開発工数: 2-3週間
- ROI: 3ヶ月で回収見込み