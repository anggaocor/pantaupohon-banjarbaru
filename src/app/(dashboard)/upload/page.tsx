// app/upload/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/src/components/ui";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Trash2,
  FileText,
  Database,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Calendar,
  User,
  MapPin,
  TreePine,
  Scissors,
  Axe,
  FileJson,
  FileCog,
  Shield,
  HardDrive,
  Clock,
  Info
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import "moment/locale/id";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

moment.locale('id');

interface UploadHistory {
  id: string;
  filename: string;
  file_size: number;
  row_count: number;
  success_count: number;
  failed_count: number;
  status: 'success' | 'failed' | 'processing';
  uploaded_by: string;
  uploaded_at: string;
  errors?: string[];
}

interface PreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<UploadHistory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [mapping, setMapping] = useState({
    nama: 'nama',
    perihal: 'perihal',
    nomor_surat: 'nomor_surat',
    tanggal_surat: 'tanggal_surat',
    alamat: 'alamat',
    koordinat: 'koordinat',
    kontak: 'kontak',
    type: 'type',
    keterangan: 'keterangan',
    status: 'status',
    jumlah_pohon: 'jumlah_pohon',
    pemangkasan: 'pemangkasan',
    penebangan: 'penebangan'
  });

  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      setUser(session.user);
      
      // Fetch profile untuk cek role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
      
      // Cek apakah user adalah admin
      if (profileData?.role !== 'admin') {
        toast.error("Anda tidak memiliki akses ke halaman ini");
        router.push("/dashboard");
        return;
      }

      await fetchUploadHistory();
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const fetchUploadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('upload_history')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUploadHistory(data || []);
    } catch (error) {
      console.error("Error fetching upload history:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validasi file
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'text/plain' // .csv
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error("Format file harus Excel (.xlsx, .xls) atau CSV");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    setFile(selectedFile);
    previewFile(selectedFile);
  };

  const previewFile = async (file: File) => {
    try {
      setProcessing(true);
      
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = await file.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data.slice(0, 5).map((row: any) => 
              headers.map(h => row[h] || '')
            );
            
            setPreviewData({
              headers,
              rows,
              totalRows: results.data.length
            });
            setShowPreview(true);
            setProcessing(false);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            toast.error("Gagal membaca file CSV");
            setProcessing(false);
          }
        });
      } else {
        // Parse Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1, 6) as any[][];
        
        setPreviewData({
          headers,
          rows,
          totalRows: jsonData.length - 1
        });
        setShowPreview(true);
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error previewing file:", error);
      toast.error("Gagal membaca file");
      setProcessing(false);
    }
  };

  const validateData = (data: any[]) => {
    const errors: string[] = [];
    const validData: any[] = [];
    
    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      
      // Validasi required fields
      if (!row[mapping.nama]) rowErrors.push(`Baris ${index + 2}: Nama wajib diisi`);
      if (!row[mapping.perihal]) rowErrors.push(`Baris ${index + 2}: Perihal wajib diisi`);
      if (!row[mapping.nomor_surat]) rowErrors.push(`Baris ${index + 2}: Nomor surat wajib diisi`);
      if (!row[mapping.tanggal_surat]) rowErrors.push(`Baris ${index + 2}: Tanggal surat wajib diisi`);
      if (!row[mapping.alamat]) rowErrors.push(`Baris ${index + 2}: Alamat wajib diisi`);
      
      // Validasi type
      const type = row[mapping.type];
      if (type && !['permohonan', 'pemeliharaan'].includes(type)) {
        rowErrors.push(`Baris ${index + 2}: Type harus 'permohonan' atau 'pemeliharaan'`);
      }
      
      // Validasi status
      const status = row[mapping.status];
      if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
        rowErrors.push(`Baris ${index + 2}: Status harus 'pending', 'in_progress', atau 'completed'`);
      }
      
      // Validasi koordinat
      const koordinat = row[mapping.koordinat];
      if (koordinat) {
        const coordRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
        if (!coordRegex.test(koordinat)) {
          rowErrors.push(`Baris ${index + 2}: Format koordinat tidak valid`);
        }
      }
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validData.push({
          nama: row[mapping.nama],
          perihal: row[mapping.perihal],
          nomor_surat: row[mapping.nomor_surat],
          tanggal_surat: row[mapping.tanggal_surat],
          alamat: row[mapping.alamat],
          koordinat: row[mapping.koordinat],
          kontak: row[mapping.kontak] || null,
          type: row[mapping.type] || 'permohonan',
          keterangan: row[mapping.keterangan] || null,
          status: row[mapping.status] || 'pending',
          jumlah_pohon: parseInt(row[mapping.jumlah_pohon]) || 0,
          pemangkasan: parseInt(row[mapping.pemangkasan]) || 0,
          penebangan: parseInt(row[mapping.penebangan]) || 0,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    
    return { validData, errors };
  };

  const processUpload = async () => {
    if (!file || !previewData) return;

    setUploading(true);
    
    try {
      // Parse full data
      let allData: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const results = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: reject
          });
        });
        allData = results;
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        allData = jsonData;
      }

      // Validasi data
      const { validData, errors } = validateData(allData);

      if (errors.length > 0) {
        toast.error(`Terdapat ${errors.length} kesalahan dalam file`);
        console.error("Validation errors:", errors);
        
        // Simpan history dengan status failed
        await supabase.from('upload_history').insert({
          filename: file.name,
          file_size: file.size,
          row_count: allData.length,
          success_count: 0,
          failed_count: errors.length,
          status: 'failed',
          uploaded_by: user.id,
          errors: errors.slice(0, 10) // Simpan 10 error pertama
        });
        
        return;
      }

      // Insert data ke database
      const { data: insertedData, error } = await supabase
        .from('pemantauan_pohon')
        .insert(validData)
        .select();

      if (error) throw error;

      // Simpan history sukses
      await supabase.from('upload_history').insert({
        filename: file.name,
        file_size: file.size,
        row_count: allData.length,
        success_count: validData.length,
        failed_count: 0,
        status: 'success',
        uploaded_by: user.id
      });

      toast.success(`${validData.length} data berhasil diupload!`);
      
      // Reset state
      setFile(null);
      setPreviewData(null);
      setShowPreview(false);
      
      // Refresh history
      await fetchUploadHistory();

    } catch (error: any) {
      console.error("Error uploading data:", error);
      toast.error("Gagal mengupload data: " + error.message);
      
      // Simpan history error
      await supabase.from('upload_history').insert({
        filename: file?.name,
        file_size: file?.size,
        row_count: 0,
        success_count: 0,
        failed_count: 1,
        status: 'failed',
        uploaded_by: user.id,
        errors: [error.message]
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'nama',
      'perihal',
      'nomor_surat',
      'tanggal_surat',
      'alamat',
      'koordinat',
      'kontak',
      'type',
      'keterangan',
      'status',
      'jumlah_pohon',
      'pemangkasan',
      'penebangan'
    ];

    const exampleData = [
      {
        nama: 'Budi Santoso',
        perihal: 'Permohonan Pemangkasan',
        nomor_surat: '001/SP/2024',
        tanggal_surat: '2024-01-15',
        alamat: 'Jl. A. Yani No. 123',
        koordinat: '-3.4431, 114.8308',
        kontak: '081234567890',
        type: 'permohonan',
        keterangan: 'Pemangkasan pohon depan rumah',
        status: 'pending',
        jumlah_pohon: '5',
        pemangkasan: '',
        penebangan: ''
      },
      {
        nama: 'Petugas Dinas',
        perihal: 'Pemeliharaan Rutin',
        nomor_surat: '002/SP/2024',
        tanggal_surat: '2024-01-16',
        alamat: 'Kawasan Banjarbaru',
        koordinat: '-3.4452, 114.8321',
        kontak: '081298765432',
        type: 'pemeliharaan',
        keterangan: 'Pemeliharaan pohon di taman',
        status: 'in_progress',
        jumlah_pohon: '12',
        pemangkasan: '8',
        penebangan: '4'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_upload_pohon.xlsx');
    
    toast.success('Template berhasil didownload');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredHistory = uploadHistory.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Memuat halaman upload...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl border border-emerald-500/30">
              <Upload className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Upload Data Excel/CSV
              </h1>
              <p className="text-gray-400 mt-1">
                Upload data pemantauan pohon secara massal menggunakan file Excel atau CSV
              </p>
            </div>
          </div>

          {/* Admin Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <Shield className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-400">Akses Administrator</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Card */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-400" />
                Upload File
              </h3>

              {/* Download Template */}
              <button
                onClick={downloadTemplate}
                className="w-full mb-4 p-4 bg-gray-700/50 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Download className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Download Template</p>
                    <p className="text-xs text-gray-400">Excel template dengan contoh data</p>
                  </div>
                </div>
              </button>

              {/* File Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pilih File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 file:cursor-pointer cursor-pointer bg-gray-900 border border-gray-700 rounded-lg"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Format: Excel (.xlsx, .xls) atau CSV (maksimal 10MB)
                </p>
              </div>

              {/* File Info */}
              {file && (
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 mb-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(file.size)} • {previewData?.totalRows || 0} baris
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewData(null);
                        setShowPreview(false);
                      }}
                      className="p-1 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <XCircle className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {file && previewData && (
                <button
                  onClick={processUpload}
                  disabled={uploading || processing}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload Data
                    </>
                  )}
                </button>
              )}
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-400 mb-2">Panduan Upload</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>Gunakan template yang sudah disediakan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>Pastikan format tanggal: YYYY-MM-DD</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>Koordinat: latitude,longitude (contoh: -3.4431,114.8308)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>Type: permohonan / pemeliharaan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>Status: pending / in_progress / completed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Preview & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Section */}
            {showPreview && previewData && (
              <Card className="p-6 bg-gray-800 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-emerald-400" />
                    Preview Data (5 baris pertama)
                  </h3>
                  <span className="text-sm text-gray-400">
                    Total {previewData.totalRows} baris
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-700/50">
                        {previewData.headers.slice(0, 8).map((header, index) => (
                          <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                        {previewData.headers.length > 8 && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">
                            ...
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {previewData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-700/50">
                          {row.slice(0, 8).map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 text-sm text-gray-300 truncate max-w-[150px]">
                              {cell || '-'}
                            </td>
                          ))}
                          {row.length > 8 && (
                            <td className="px-4 py-2 text-sm text-gray-300">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Upload History */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  Riwayat Upload
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-gray-400 hover:text-white"
                >
                  {showHistory ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              {showHistory && (
                <>
                  {/* Search & Filter */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Cari file..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    >
                      <option value="all">Semua Status</option>
                      <option value="success">Berhasil</option>
                      <option value="failed">Gagal</option>
                      <option value="processing">Diproses</option>
                    </select>
                  </div>

                  {/* History List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Database className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                        <p>Belum ada riwayat upload</p>
                      </div>
                    ) : (
                      filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedHistory(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-white text-sm truncate max-w-[200px]">
                                {item.filename}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.status === 'success' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {item.status === 'success' ? 'Berhasil' :
                               item.status === 'failed' ? 'Gagal' : 'Diproses'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                            <div>Ukuran: {formatFileSize(item.file_size)}</div>
                            <div>Baris: {item.row_count}</div>
                            <div>Sukses: {item.success_count}</div>
                            <div>Gagal: {item.failed_count}</div>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            {moment(item.uploaded_at).format('DD MMM YYYY HH:mm')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </Card>

            {/* Error Details Modal */}
            {selectedHistory && selectedHistory.errors && selectedHistory.errors.length > 0 && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <Card className="p-6 max-w-2xl w-full bg-gray-800 border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      Detail Error
                    </h3>
                    <button
                      onClick={() => setSelectedHistory(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    File: {selectedHistory.filename}
                  </p>
                  
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {selectedHistory.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                        {error}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setSelectedHistory(null)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}