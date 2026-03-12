// app/error.tsx
'use client'

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  // Tentukan konten berdasarkan status code
  const getErrorContent = () => {
    const statusCode = error.statusCode || 500;
    
    const errorMap: Record<number, { title: string; message: string; icon: string }> = {
      400: {
        title: 'Permintaan Tidak Valid',
        message: 'Maaf, kami tidak dapat memproses permintaan Anda.',
        icon: '🤔'
      },
      401: {
        title: 'Tidak Diizinkan',
        message: 'Anda perlu login untuk mengakses halaman ini.',
        icon: '🔒'
      },
      403: {
        title: 'Akses Ditolak',
        message: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
        icon: '🚫'
      },
      404: {
        title: 'Halaman Tidak Ditemukan',
        message: 'Halaman yang Anda cari tidak ada atau telah dipindahkan.',
        icon: '🔍'
      },
      500: {
        title: 'Kesalahan Server',
        message: 'Maaf, terjadi kesalahan pada server kami.',
        icon: '⚠️'
      },
      503: {
        title: 'Layanan Tidak Tersedia',
        message: 'Layanan sedang dalam pemeliharaan. Silakan coba lagi nanti.',
        icon: '🔧'
      }
    };

    return errorMap[statusCode] || errorMap[500];
  };

  const content = getErrorContent();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icon dan Status Code */}
        <div className="text-8xl mb-4">{content.icon}</div>
        <div className="text-6xl font-bold text-gray-300 mb-4">
          {error.statusCode || 500}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {content.title}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {content.message}
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Coba Lagi
          </button>

          <Link
            href="/"
            className="block w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Kembali ke Beranda
          </Link>
        </div>

        {/* Tombol Bantuan */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500 mb-3">
            Butuh bantuan lebih lanjut?
          </p>
          <Link
            href="/contact"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Hubungi Tim Support →
          </Link>
        </div>
      </div>
    </div>
  );
}