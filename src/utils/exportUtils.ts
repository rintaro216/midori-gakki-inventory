import type { Database } from '@/lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

export const exportToCSV = (data: InventoryItem[], filename: string = 'inventory') => {
  const headers = [
    'ID',
    'カテゴリ',
    '商品名',
    'メーカー',
    '型番',
    'カラー',
    '状態',
    '価格',
    '備考',
    '登録日'
  ]

  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      item.id,
      item.category,
      `"${item.product_name}"`,
      `"${item.manufacturer}"`,
      item.model_number,
      `"${item.color}"`,
      item.condition,
      item.price,
      `"${item.notes || ''}"`,
      new Date(item.created_at).toLocaleDateString('ja-JP')
    ].join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const exportToExcel = (data: InventoryItem[], filename: string = 'inventory') => {
  const headers = ['ID', 'カテゴリ', '商品名', 'メーカー', '型番', 'カラー', '状態', '価格', '備考', '登録日']

  const tableHTML = `
    <table>
      <thead>
        <tr>
          ${headers.map(header => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(item => `
          <tr>
            <td>${item.id}</td>
            <td>${item.category}</td>
            <td>${item.product_name}</td>
            <td>${item.manufacturer}</td>
            <td>${item.model_number}</td>
            <td>${item.color}</td>
            <td>${item.condition}</td>
            <td>${item.price}</td>
            <td>${item.notes || ''}</td>
            <td>${new Date(item.created_at).toLocaleDateString('ja-JP')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}