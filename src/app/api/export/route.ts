// app/api/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Contoh data
    const data = [
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
    ];

    // Tentukan kolom yang akan diexport
    const headers = ['ID', 'Nama', 'Email', 'Umur'];
    
    // Konversi data ke CSV
    const csvRows = [];
    
    // Tambahkan headers
    csvRows.push(headers.join(','));
    
    // Tambahkan data
    for (const row of data) {
      const values = [
        row.id,
        `"${row.name}"`, // Escape dengan quotes untuk menghindari koma
        row.email,
        row.age
      ];
      csvRows.push(values.join(','));
    }
    
    const csvContent = csvRows.join('\n');

    // Set response headers untuk download file
    const filename = `export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: 'Gagal export data' },
      { status: 500 }
    );
  }
}

// Export dengan parameter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, columns, filename } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      );
    }

    // Gunakan kolom yang ditentukan atau ambil dari data pertama
    let headers: string[] = columns || [];
    if (headers.length === 0 && data.length > 0) {
      headers = Object.keys(data[0]);
    }

    // Buat CSV
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape jika mengandung koma atau quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    
    const exportFilename = filename || `export-${Date.now()}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${exportFilename}"`,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal export data' },
      { status: 500 }
    );
  }
}