"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface FormData {
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
}

export default function InputPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nama: "",
    perihal: "",
    nomor_surat: "",
    tanggal_surat: new Date().toISOString().split('T')[0],
    alamat: "",
    koordinat: "",
    kontak: "",
    type: "permohonan",
    keterangan: "",
    status: "pending",
    pemangkasan: 0,
    penebangan: 0,
    jumlah_pohon: 0,
  });

  // Proteksi halaman
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      setUser(session.user);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    };

    checkSession();
  }, [router]);

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

    if (!formData.nama.trim()) newErrors.nama = "Nama wajib diisi";
    if (!formData.perihal.trim()) newErrors.perihal = "Perihal wajib diisi";
    if (!formData.nomor_surat.trim()) newErrors.nomor_surat = "Nomor surat wajib diisi";
    if (!formData.tanggal_surat) newErrors.tanggal_surat = "Tanggal surat wajib diisi";
    if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";
    if (!formData.koordinat.trim()) newErrors.koordinat = "Koordinat wajib diisi";
    
    if (formData.koordinat.trim()) {
      const coordRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
      if (!coordRegex.test(formData.koordinat.trim())) {
        newErrors.koordinat = "Format koordinat tidak valid. Gunakan: latitude, longitude";
      }
    }

    if (formData.type === "pemeliharaan") {
      if (formData.pemangkasan <= 0 && formData.penebangan <= 0) {
        newErrors.pemangkasan = "Minimal salah satu (pemangkasan atau penebangan) harus diisi";
        newErrors.penebangan = "Minimal salah satu (pemangkasan atau penebangan) harus diisi";
      }
    }

    if (formData.kontak && !/^[0-9+\-\s()]{10,15}$/.test(formData.kontak)) {
      newErrors.kontak = "Format nomor telepon tidak valid";
    }

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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      toast.error("Anda harus login terlebih dahulu.");
      router.push("/login");
      setUploading(false);
      return;
    }

    try {
      const dataToInsert = {
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
        pemangkasan: formData.type === "pemeliharaan" ? formData.pemangkasan : null,
        penebangan: formData.type === "pemeliharaan" ? formData.penebangan : null,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("pemantauan_pohon").insert(dataToInsert);

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      toast.success("Data berhasil disimpan!", {
        description: "Data telah tersimpan ke sistem pemantauan pohon.",
      });

      setFormData({
        nama: "",
        perihal: "",
        nomor_surat: "",
        tanggal_surat: new Date().toISOString().split('T')[0],
        alamat: "",
        koordinat: "",
        kontak: "",
        type: "permohonan",
        keterangan: "",
        status: "pending",
        pemangkasan: 0,
        penebangan: 0,
        jumlah_pohon: 0,
      });
      setErrors({});

    } catch (error: any) {
      console.error("Save Error:", error);
      toast.error("Gagal menyimpan data", {
        description: error.message || "Terjadi kesalahan yang tidak diketahui.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === "jumlah_pohon" && formData.type === "permohonan") {
      setFormData((prev) => ({
        ...prev,
        jumlah_pohon: parseInt(value) || 0,
      }));
    } 
    else if (name === "pemangkasan" || name === "penebangan") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    }
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseInt(value) || 0 : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "permohonan": return <FileText className="h-5 w-5" />;
      case "pemeliharaan": return <TreePine className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "permohonan": return "border-blue-600 bg-blue-500/10 text-blue-400";
      case "pemeliharaan": return "border-green-600 bg-green-500/10 text-green-400";
      default: return "border-gray-600 bg-gray-800 text-gray-400";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed": return "border-green-600 bg-green-500/10 text-green-400";
      case "in_progress": return "border-blue-600 bg-blue-500/10 text-blue-400";
      case "pending": return "border-yellow-600 bg-yellow-500/10 text-yellow-400";
      default: return "border-gray-600 bg-gray-800 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
            Input Data Pemantauan Pohon
          </h1>
          <p className="text-gray-400">
            Lengkapi form berikut untuk menambahkan data permohonan atau pemeliharaan pohon
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-800 border border-gray-700 px-6 py-2 rounded-full">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-gray-300">
              Login sebagai: <span className="font-medium text-emerald-400">{user?.email}</span>
            </span>
          </div>
        </div>

        {/* Main Form */}
        <Card className="p-6 md:p-8 bg-gray-800 border-gray-700 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Tipe Kegiatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Jenis Kegiatan <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["permohonan", "pemeliharaan"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type, jumlah_pohon: 0, pemangkasan: 0, penebangan: 0 }));
                      if (errors.type) setErrors(prev => ({ ...prev, type: "" }));
                    }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.type === type 
                        ? getTypeStyle(type)
                        : "border-gray-700 hover:border-gray-600 bg-gray-900 text-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {getTypeIcon(type)}
                      <span className="font-medium text-sm">
                        {type === "permohonan" && "Permohonan"}
                        {type === "pemeliharaan" && "Pemeliharaan"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.type}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Status Kegiatan <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["pending", "in_progress", "completed"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.status === status
                        ? getStatusStyle(status)
                        : "border-gray-700 hover:border-gray-600 bg-gray-900 text-gray-400"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1 text-emerald-400" />
                  Nama Pemohon/Petugas <span className="text-red-400">*</span>
                </label>
                <input
                  name="nama"
                  className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                    errors.nama 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                      : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.nama}
                  placeholder="Nama lengkap"
                />
                {errors.nama && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nama}
                  </p>
                )}
              </div>

              {/* Perihal */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FileText className="inline h-4 w-4 mr-1 text-emerald-400" />
                  Perihal <span className="text-red-400">*</span>
                </label>
                <input
                  name="perihal"
                  className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                    errors.perihal 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                      : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.perihal}
                  placeholder="Perihal kegiatan"
                />
                {errors.perihal && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.perihal}
                  </p>
                )}
              </div>

              {/* Nomor Surat */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nomor Surat <span className="text-red-400">*</span>
                </label>
                <input
                  name="nomor_surat"
                  className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                    errors.nomor_surat 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                      : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.nomor_surat}
                  placeholder="No. Surat/Registrasi"
                />
                {errors.nomor_surat && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nomor_surat}
                  </p>
                )}
              </div>

              {/* Tanggal Surat */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1 text-emerald-400" />
                  Tanggal Surat <span className="text-red-400">*</span>
                </label>
                <input
                  name="tanggal_surat"
                  type="date"
                  className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                    errors.tanggal_surat 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                      : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.tanggal_surat}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.tanggal_surat && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.tanggal_surat}
                  </p>
                )}
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Alamat Lengkap <span className="text-red-400">*</span>
              </label>
              <textarea
                name="alamat"
                rows={3}
                className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                  errors.alamat 
                    ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                    : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                }`}
                onChange={handleChange}
                value={formData.alamat}
                placeholder="Alamat lengkap lokasi kegiatan"
              />
              {errors.alamat && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.alamat}
                </p>
              )}
            </div>

            {/* Koordinat */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-1 text-emerald-400" />
                Koordinat GPS <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  name="koordinat"
                  className={`flex-1 px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                    errors.koordinat 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                      : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                  }`}
                  onChange={handleChange}
                  value={formData.koordinat}
                  placeholder="Contoh: -6.2088, 106.8456"
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Mendeteksi...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-5 w-5" />
                      Deteksi Lokasi
                    </>
                  )}
                </button>
              </div>
              {errors.koordinat ? (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="inline h-4 w-4 mr-1 text-emerald-400" />
                Kontak
              </label>
              <input
                name="kontak"
                className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                  errors.kontak 
                    ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                    : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                }`}
                onChange={handleChange}
                value={formData.kontak}
                placeholder="No. HP/Telepon"
              />
              {errors.kontak && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.kontak}
                </p>
              )}
            </div>

            {/* Field untuk Permohonan */}
            {formData.type === "permohonan" && (
              <div className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/30 rounded-xl">
                <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Data Permohonan
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FileText className="inline h-4 w-4 mr-1 text-blue-400" />
                    Jumlah Pohon (Opsional)
                  </label>
                  <input
                    name="jumlah_pohon"
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-900 border-2 border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-white placeholder-gray-500"
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
              <div className="p-6 bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-500/30 rounded-xl">
                <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  Data Pemeliharaan Pohon
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Jumlah Pohon Dipangkas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Scissors className="inline h-4 w-4 mr-1 text-yellow-400" />
                      Jumlah Pohon Dipangkas
                    </label>
                    <div className="relative">
                      <Scissors className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500/50" />
                      <input
                        name="pemangkasan"
                        type="number"
                        min="0"
                        className={`w-full pl-10 px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                          errors.pemangkasan 
                            ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                            : "border-gray-700 focus:ring-yellow-500/30 focus:border-yellow-500"
                        }`}
                        onChange={handleChange}
                        value={formData.pemangkasan}
                        placeholder="Jumlah pohon yang dipangkas"
                      />
                    </div>
                    {errors.pemangkasan && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.pemangkasan}
                      </p>
                    )}
                  </div>

                  {/* Jumlah Pohon Ditebang */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Axe className="inline h-4 w-4 mr-1 text-red-400" />
                      Jumlah Pohon Ditebang
                    </label>
                    <div className="relative">
                      <Axe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500/50" />
                      <input
                        name="penebangan"
                        type="number"
                        min="0"
                        className={`w-full pl-10 px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                          errors.penebangan 
                            ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                            : "border-gray-700 focus:ring-red-500/30 focus:border-red-500"
                        }`}
                        onChange={handleChange}
                        value={formData.penebangan}
                        placeholder="Jumlah pohon yang ditebang"
                      />
                    </div>
                    {errors.penebangan && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.penebangan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Jumlah Pohon (Otomatis) */}
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Calculator className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Jumlah Pohon</p>
                      <p className="text-2xl font-bold text-green-400">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Keterangan Tambahan
              </label>
              <textarea
                name="keterangan"
                rows={3}
                className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                onChange={handleChange}
                value={formData.keterangan}
                placeholder="Catatan tambahan atau penjelasan lebih detail"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t-2 border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Simpan Data
                    </>
                  )}
                </button>
                
                <Link
                  href="/dashboard"
                  className="px-8 py-4 border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Batal
                </Link>
              </div>
              <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Field dengan tanda * wajib diisi
              </p>
            </div>
          </form>
        </Card>

        {/* Info Panel */}
        <Card className="mt-6 p-6 bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-400 mb-1">Informasi Penting</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• <span className="font-medium text-blue-400">Permohonan</span>: Jumlah pohon dapat diisi manual (opsional)</li>
                <li>• <span className="font-medium text-green-400">Pemeliharaan</span>: Jumlah pohon otomatis terakumulasi dari pemangkasan + penebangan</li>
                <li>• Koordinat akan digunakan untuk menampilkan lokasi pada peta</li>
                <li>• Pastikan data yang dimasukkan akurat dan valid</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}