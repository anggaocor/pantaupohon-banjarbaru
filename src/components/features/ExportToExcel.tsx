import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export async function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array' 
  })
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  saveAs(blob, `${filename}.xlsx`)
}

export function generateCSV(data: any[]) {
  const headers = Object.keys(data[0] || {})
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ]
  return csvRows.join('\n')
}