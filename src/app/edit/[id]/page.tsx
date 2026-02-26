// app/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/src/components/ui";
import { 
  MapPin, 
  Upload, 
  User, 
  FileText, 
  Calendar, 
  Phone, 
  Navigation,
  CheckCircle,
  AlertCircle,
  TreePine,
  Scissors,
  Axe,
  Save,
  Loader2,
  Calculator,
  ArrowLeft,
  Trash2,
  Clock,
  Edit
} from "lucide-react";
import Link from "next/link";

interface FormData {
  id: string;
  nama: string;
  perihal: string;
  nomor_surat: string;
  tanggal_surat: string;
  alamat: string;
  koordinat: string;
  kontak: string;
  type: "permohonan" | "pemeliharaan";
  keterangan: string;
  status: "pending" | "in_progress" | "completed";
  pemangkasan: number;
  penebangan: number;
  jumlah_pohon: number;
  created_at: string;
  updated_at: string;
}

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    id: "",
    nama: "",
    perihal: "",
    nomor_surat: "",
    tanggal_surat: "",
    alamat: "",
    koordinat: "",
    kontak: "",
    type: "permohonan",
    keterangan: "",
    status: "pending",
    pemangkasan: 0,
    penebangan: 0,
    jumlah_pohon: 0,
    created_at: "",
    updated_at: "",
  });

  // Proteksi halaman dan ambil data
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Cek session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast.error("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Ambil data berdasarkan ID
      const { data, error } = await supabase
        .from("pemantauan_pohon")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Data tidak ditemukan");
        router.push("/laporan");
        return;
      }

      // Cek kepemilikan data (opsional - jika ingin hanya pemilik yang bisa edit)
      if (data.user_id !== session.user.id) {
        toast.error("Anda tidak memiliki akses untuk mengedit data ini");
        router.push("/laporan");
        return;
      }

      // Set form data
      setFormData({
        id: data.id,
        nama: data.nama || "",
        perihal: data.perihal || "",
        nomor_surat: data.nomor_surat || "",
        tanggal_surat: data.tanggal_surat || "",
        alamat: data.alamat || "",
        koordinat: data.koordinat || "",
        kontak: data.kontak || "",
        type: data.type || "permohonan",
        keterangan: data.keterangan || "",
        status: data.status || "pending",
        pemangkasan: data.pemangkasan || 0,
        penebangan: data.penebangan || 0,
        jumlah_pohon: data.jumlah_pohon || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });

      setLoading(false);
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  // Auto-calculate jumlah_pohon for pemeliharaan
  useEffect(() => {
    if (formData.type === "pemeliharaan") {
      setFormData(prev => ({
        ...prev,
        jumlah_pohon: (prev.pemangkasan || 0) + (prev.penebangan || 0)
      }));
    }
  }, [formData.pemangkasan, formData.penebangan, formData.type]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS tidak tersedia di browser ini");
      return;
    }

    setDetectingLocation(true);
    toast.info("Mendeteksi lokasi...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          koordinat: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        setDetectingLocation(false);
        toast.success("Lokasi berhasil dideteksi");
      },
      (error) => {
        setDetectingLocation(false);
        console.error("GPS Error:", error);
        let message = "Gagal mendeteksi lokasi";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Izin lokasi ditolak. Izinkan akses lokasi di browser Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            message = "Waktu permintaan lokasi habis.";
            break;
        }
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validasi required fields untuk semua tipe
    if (!formData.nama.trim()) newErrors.nama = "Nama wajib diisi";
    if (!formData.perihal.trim()) newErrors.perihal = "Perihal wajib diisi";
    if (!formData.nomor_surat.trim()) newErrors.nomor_surat = "Nomor surat wajib diisi";
    if (!formData.tanggal_surat) newErrors.tanggal_surat = "Tanggal surat wajib diisi";
    if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";
    if (!formData.koordinat.trim()) newErrors.koordinat = "Koordinat wajib diisi";
    
    // Validasi format koordinat
    if (formData.koordinat.trim()) {
      const coordRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
      if (!coordRegex.test(formData.koordinat.trim())) {
        newErrors.koordinat = "Format koordinat tidak valid. Gunakan: latitude, longitude";
      }
    }

    // Validasi untuk tipe pemeliharaan
    if (formData.type === "pemeliharaan") {
      if (formData.pemangkasan <= 0 && formData.penebangan <= 0) {
        newErrors.pemangkasan = "Minimal salah satu (pemangkasan atau penebangan) harus diisi";
        newErrors.penebangan = "Minimal salah satu (pemangkasan atau penebangan) harus diisi";
      }
    }

    // Validasi kontak (opsional, jika diisi harus valid)
    if (formData.kontak && !/^[0-9+\-\s()]{10,15}$/.test(formData.kontak)) {
      newErrors.kontak = "Format nomor telepon tidak valid";
    }

    // Validasi tanggal tidak boleh di masa depan
    if (formData.tanggal_surat) {
      const inputDate = new Date(formData.tanggal_surat);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      inputDate.setHours(0, 0, 0, 0);
      if (inputDate > today) {
        newErrors.tanggal_surat = "Tanggal tidak boleh di masa depan";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Harap perbaiki kesalahan pada form");
      return;
    }

    setUploading(true);

    const supabase = createClient();

    try {
      // Data yang akan diupdate
      const dataToUpdate = {
        nama: formData.nama.trim(),
        perihal: formData.perihal.trim(),
        nomor_surat: formData.nomor_surat.trim(),
        tanggal_surat: formData.tanggal_surat,
        alamat: formData.alamat.trim(),
        koordinat: formData.koordinat.trim(),
        kontak: formData.kontak.trim() || null,
        type: formData.type,
        keterangan: formData.keterangan.trim() || null,
        status: formData.status,
        jumlah_pohon: formData.jumlah_pohon,
        // Untuk pemeliharaan, isi kolom pemangkasan dan penebangan
        pemangkasan: formData.type === "pemeliharaan" ? formData.pemangkasan : null,
        penebangan: formData.type === "pemeliharaan" ? formData.penebangan : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("pemantauan_pohon")
        .update(dataToUpdate)
        .eq("id", formData.id);

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      toast.success("Data berhasil diperbarui!", {
        description: "Perubahan data telah tersimpan.",
      });

      // Redirect ke halaman laporan
      router.push("/laporan");

    } catch (error: any) {
      console.error("Update Error:", error);
      toast.error("Gagal memperbarui data", {
        description: error.message || "Terjadi kesalahan yang tidak diketahui.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("pemantauan_pohon")
        .delete()
        .eq("id", formData.id);

      if (error) throw error;

      toast.success("Data berhasil dihapus");
      router.push("/laporan");
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus data");
    } finally {
      setUploading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Untuk field jumlah_pohon di permohonan, bisa diisi manual
    if (name === "jumlah_pohon" && formData.type === "permohonan") {
      setFormData((prev) => ({
        ...prev,
        jumlah_pohon: parseInt(value) || 0,
      }));
    } 
    // Untuk field pemangkasan dan penebangan di pemeliharaan
    else if (name === "pemangkasan" || name === "penebangan") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    }
    // Untuk field lainnya
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseInt(value) || 0 : value,
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "permohonan": return <FileText className="h-5 w-5" />;
      case "pemeliharaan": return <TreePine className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "permohonan": return "border-blue-500 bg-blue-50 text-blue-700";
      case "pemeliharaan": return "border-green-500 bg-green-50 text-green-700";
      default: return "border-gray-300 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "border-green-500 bg-green-50 text-green-700";
      case "in_progress": return "border-blue-500 bg-blue-50 text-blue-700";
      case "pending": return "border-yellow-500 bg-yellow-50 text-yellow-700";
      default: return "border-gray-300 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "✅ Selesai";
      case "in_progress": return "🔄 Dalam Proses";
      case "pending": return "⏳ Menunggu";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Laporan
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Edit className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Data Pemantauan Pohon
            </h1>
          </div>
          <p className="text-gray-600">
            Edit ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{formData.id}</span>
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Dibuat: {formatDate(formData.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              <span>Diperbarui: {formatDate(formData.updated_at)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 bg-white px-6 py-2 rounded-full shadow-sm">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-gray-600">
              Login sebagai: <span className="font-medium text-emerald-700">{user?.email}</span>
            </span>
          </div>
        </div>

        {/* Main Form */}
        <Card className="p-6 md:p-8 shadow-xl border-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Tipe Kegiatan (Read-only untuk edit) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Jenis Kegiatan
              </label>
              <div className={`p-4 rounded-xl border-2 ${getTypeColor(formData.type)} flex items-center gap-3`}>
                {getTypeIcon(formData.type)}
                <span className="font-medium">
                  {formData.type === "permohonan" ? "Permohonan" : "Pemeliharaan"}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  *Tidak dapat diubah
                </span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Status Kegiatan <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["pending", "in_progress", "completed"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.status === status
                        ? getStatusColor(status)
                        : "border-gray-200 hover:border-gray-300 bg-white text-gray-600"
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {status === "pending" && "⏳ Menunggu"}
                      {status === "in_progress" && "🔄 Dalam Proses"}
                      {status === "completed" && "✅ Selesai"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid untuk informasi dasar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1 text-emerald-600" />
                  Nama Pemohon/Petugas <span className="text-red-500">*</span>
                </label>
                <input
                  name="nama"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.nama 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                      : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.nama}
                  placeholder="Nama lengkap"
                />
                {errors.nama && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nama}
                  </p>
                )}
              </div>

              {/* Perihal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1 text-emerald-600" />
                  Perihal <span className="text-red-500">*</span>
                </label>
                <input
                  name="perihal"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.perihal 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                      : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.perihal}
                  placeholder="Perihal kegiatan"
                />
                {errors.perihal && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.perihal}
                  </p>
                )}
              </div>

              {/* Nomor Surat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Surat <span className="text-red-500">*</span>
                </label>
                <input
                  name="nomor_surat"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.nomor_surat 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                      : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.nomor_surat}
                  placeholder="No. Surat/Registrasi"
                />
                {errors.nomor_surat && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nomor_surat}
                  </p>
                )}
              </div>

              {/* Tanggal Surat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1 text-emerald-600" />
                  Tanggal Surat <span className="text-red-500">*</span>
                </label>
                <input
                  name="tanggal_surat"
                  type="date"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.tanggal_surat 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                      : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.tanggal_surat}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.tanggal_surat && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.tanggal_surat}
                  </p>
                )}
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                name="alamat"
                rows={3}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.alamat 
                    ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                    : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
                }`}
                onChange={handleChange}
                value={formData.alamat}
                placeholder="Alamat lengkap lokasi kegiatan"
              />
              {errors.alamat && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.alamat}
                </p>
              )}
            </div>

            {/* Koordinat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1 text-emerald-600" />
                Koordinat GPS <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  name="koordinat"
                  className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.koordinat 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                      : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.koordinat}
                  placeholder="Contoh: -6.2088, 106.8456"
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Mendeteksi...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-5 w-5" />
                      Update Lokasi
                    </>
                  )}
                </button>
              </div>
              {errors.koordinat ? (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.koordinat}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  Format: latitude, longitude (gunakan titik untuk desimal)
                </p>
              )}
            </div>

            {/* Kontak */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1 text-emerald-600" />
                Kontak
              </label>
              <input
                name="kontak"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.kontak 
                    ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                    : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
                }`}
                onChange={handleChange}
                value={formData.kontak}
                placeholder="No. HP/Telepon"
              />
              {errors.kontak && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.kontak}
                </p>
              )}
            </div>

            {/* Field untuk Permohonan */}
            {formData.type === "permohonan" && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Data Permohonan
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1 text-blue-600" />
                    Jumlah Pohon (Opsional)
                  </label>
                  <input
                    name="jumlah_pohon"
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    onChange={handleChange}
                    value={formData.jumlah_pohon || ""}
                    placeholder="Total jumlah pohon yang diajukan"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Isi manual untuk referensi, tidak wajib diisi
                  </p>
                </div>
              </div>
            )}

            {/* Field untuk Pemeliharaan */}
            {formData.type === "pemeliharaan" && (
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  Data Pemeliharaan Pohon
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Jumlah Pohon Dipangkas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Scissors className="inline h-4 w-4 mr-1 text-yellow-600" />
                      Jumlah Pohon Dipangkas
                    </label>
                    <div className="relative">
                      <Scissors className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
                      <input
                        name="pemangkasan"
                        type="number"
                        min="0"
                        className={`w-full pl-10 px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          errors.pemangkasan 
                            ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                            : "border-gray-200 focus:ring-yellow-200 focus:border-yellow-500"
                        }`}
                        onChange={handleChange}
                        value={formData.pemangkasan}
                        placeholder="Jumlah pohon yang dipangkas"
                      />
                    </div>
                    {errors.pemangkasan && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.pemangkasan}
                      </p>
                    )}
                  </div>

                  {/* Jumlah Pohon Ditebang */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Axe className="inline h-4 w-4 mr-1 text-red-600" />
                      Jumlah Pohon Ditebang
                    </label>
                    <div className="relative">
                      <Axe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                      <input
                        name="penebangan"
                        type="number"
                        min="0"
                        className={`w-full pl-10 px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          errors.penebangan 
                            ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                            : "border-gray-200 focus:ring-red-200 focus:border-red-500"
                        }`}
                        onChange={handleChange}
                        value={formData.penebangan}
                        placeholder="Jumlah pohon yang ditebang"
                      />
                    </div>
                    {errors.penebangan && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.penebangan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Jumlah Pohon (Otomatis) */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Jumlah Pohon</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formData.pemangkasan + formData.penebangan}
                      </p>
                      <p className="text-xs text-gray-500">
                        Terakumulasi otomatis dari pemangkasan + penebangan
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Minimal salah satu field (pemangkasan atau penebangan) harus diisi
                </p>
              </div>
            )}

            {/* Keterangan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan Tambahan
              </label>
              <textarea
                name="keterangan"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                onChange={handleChange}
                value={formData.keterangan}
                placeholder="Catatan tambahan atau penjelasan lebih detail"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t-2 border-gray-100">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Update Data
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={uploading}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-200"
                >
                  <Trash2 className="h-5 w-5" />
                  Hapus Data
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Field dengan tanda * wajib diisi
              </p>
            </div>
          </form>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Hapus Data?
                </h3>
                <p className="text-gray-600 mb-6">
                  Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menghapus...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Info Panel */}
        <Card className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Informasi Edit Data</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Jenis kegiatan tidak dapat diubah setelah data dibuat</li>
                <li>• Perubahan akan tercatat dengan timestamp terbaru</li>
                <li>• Pastikan data yang diedit akurat dan valid</li>
                <li>• Data yang dihapus tidak dapat dikembalikan</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}