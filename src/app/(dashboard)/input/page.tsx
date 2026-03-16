'use client'

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
  ArrowLeft,
  Shield,
  Ban,
  X,
  Camera,
  Trash2,
  Image as ImageIcon // Rename import untuk Lucide Image
} from "lucide-react";
import NextImage from "next/image"; // Rename import untuk Next.js Image
import Link from "next/link";

interface FormData {
  nama: string;
  perihal: string;
  nomor_surat: string;
  tanggal_surat: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  koordinat: string;
  kontak: string;
  type: "permohonan" | "pemeliharaan";
  keterangan: string;
  status: "pending" | "in_progress" | "completed";
  pemangkasan: number;
  penebangan: number;
  jumlah_pohon: number;
}

interface UploadedFile {
  id?: string;
  file: File;
  preview: string;
  progress: number;
  uploading: boolean;
  url?: string;
  path?: string;
}

export default function InputPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State untuk upload foto
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nama: "",
    perihal: "",
    nomor_surat: "",
    tanggal_surat: new Date().toISOString().split('T')[0],
    alamat: "",
    kecamatan: "",
    kelurahan: "",
    koordinat: "",
    kontak: "",
    type: "permohonan", // Default permohonan untuk semua user
    keterangan: "",
    status: "pending", // Default pending untuk semua
    pemangkasan: 0,
    penebangan: 0,
    jumlah_pohon: 0,
  });

  // Data mapping kecamatan dan kelurahan
  const dataKelurahan: Record<string, string[]> = {
    "Banjarbaru Selatan": [
      "Guntung Paikat",
      "Kemuning", 
      "Loktabat Selatan",
      "Sungai Besar"
    ],
    "Banjarbaru Utara": [
      "Loktabat Utara",
      "Mentaos",
      "Komet",
      "Sungai Ulin"
    ],
    "Cempaka": [
      "Bangkal",
      "Cempaka",
      "Palam",
      "Sungai Tiung"
    ],
    "Landasan Ulin": [
      "Guntung Manggis",
      "Guntung Payung",
      "Landasan Ulin Timur",
      "Syamsudin Noor"
    ],
    "Liang Anggang": [
      "Landasan Ulin Barat",
      "Landasan Ulin Selatan",
      "Landasan Ulin Tengah",
      "Landasan Ulin Utara"
    ]
  };

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
      
      // Fetch profile untuk cek role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
      
      // Cek apakah user admin
      const userIsAdmin = profileData?.role === "admin";
      setIsAdmin(userIsAdmin);
      
      // Jika bukan admin, set type ke permohonan dan status ke pending (tidak bisa diubah)
      if (!userIsAdmin) {
        setFormData(prev => ({ 
          ...prev, 
          type: "permohonan",
          status: "pending" // Force pending untuk non-admin
        }));
      }
      
      setLoading(false);
    };

    checkSession();
  }, [router]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validasi tipe file
    const invalidFiles = selectedFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validasi ukuran file (max 5MB)
    const oversizedFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    // Batasi jumlah file (maks 5)
    if (files.length + selectedFiles.length > 5) {
      toast.error('Maksimal 5 foto yang dapat diupload');
      return;
    }

    const newFiles = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      uploading: false,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Upload files to Supabase Storage
  const uploadFiles = async (recordId: string): Promise<string[]> => {
    if (files.length === 0) return [];

    const supabase = createClient();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[i].uploading = true;
        return newFiles;
      });

      try {
        // Generate unique filename
        const fileExt = file.file.name.split('.').pop();
        const fileName = `${recordId}/${Date.now()}_${i}.${fileExt}`;
        const filePath = `pohon-foto/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('pemantauan-pohon')
          .upload(filePath, file.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('pemantauan-pohon')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);

        // Update progress to complete
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i].progress = 100;
          newFiles[i].uploading = false;
          newFiles[i].url = publicUrl;
          newFiles[i].path = filePath;
          return newFiles;
        });

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Gagal upload file ${file.file.name}`);
        
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i].uploading = false;
          return newFiles;
        });
      }
    }

    return uploadedUrls;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) newErrors.nama = "Nama wajib diisi";
    if (!formData.perihal.trim()) newErrors.perihal = "Perihal wajib diisi";
    if (!formData.nomor_surat.trim()) newErrors.nomor_surat = "Nomor surat wajib diisi";
    if (!formData.tanggal_surat) newErrors.tanggal_surat = "Tanggal surat wajib diisi";
    if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";
    if (!formData.kecamatan.trim()) newErrors.kecamatan = "Kecamatan wajib diisi";
    if (!formData.kelurahan.trim()) newErrors.kelurahan = "Kelurahan wajib diisi";
    if (!formData.koordinat.trim()) newErrors.koordinat = "Koordinat wajib diisi";
    
    if (formData.koordinat.trim()) {
      const coordRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
      if (!coordRegex.test(formData.koordinat.trim())) {
        newErrors.koordinat = "Format koordinat tidak valid. Gunakan: latitude, longitude";
      }
    }

    // Validasi untuk tipe pemeliharaan (hanya untuk admin)
    if (formData.type === "pemeliharaan") {
      // Cek apakah user admin (validasi tambahan)
      if (!isAdmin) {
        newErrors.type = "Anda tidak memiliki akses untuk input pemeliharaan";
      }
      
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
    
    // Validasi tambahan untuk keamanan
    if (formData.type === "pemeliharaan" && !isAdmin) {
      toast.error("Anda tidak memiliki akses untuk input pemeliharaan");
      return;
    }
    
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
      // First, insert the main record
      const dataToInsert = {
        nama: formData.nama.trim(),
        perihal: formData.perihal.trim(),
        nomor_surat: formData.nomor_surat.trim(),
        tanggal_surat: formData.tanggal_surat,
        alamat: formData.alamat.trim(),
        kecamatan: formData.kecamatan.trim(),
        kelurahan: formData.kelurahan.trim(),
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

      const { data: insertedData, error } = await supabase
        .from("pemantauan_pohon")
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      // Then, upload files if any
      if (files.length > 0 && insertedData) {
        const photoUrls = await uploadFiles(insertedData.id);
        
        // Save photo references to database (optional - if you want to store in a separate table)
        if (photoUrls.length > 0) {
          const photoRecords = photoUrls.map(url => ({
            pemantauan_id: insertedData.id,
            foto_url: url,
            created_at: new Date().toISOString(),
          }));

          const { error: photoError } = await supabase
            .from("pemantauan_foto")
            .insert(photoRecords);

          if (photoError) {
            console.error("Error saving photo references:", photoError);
          }
        }
      }

      toast.success("Data berhasil disimpan!", {
        description: `Data telah tersimpan ke sistem pemantauan pohon${files.length > 0 ? ` dengan ${files.length} foto` : ''}.`,
      });

      // Reset form
      setFormData({
        nama: "",
        perihal: "",
        nomor_surat: "",
        tanggal_surat: new Date().toISOString().split('T')[0],
        alamat: "",
        kecamatan: "",
        kelurahan: "",
        koordinat: "",
        kontak: "",
        type: isAdmin ? "permohonan" : "permohonan",
        keterangan: "",
        status: "pending",
        pemangkasan: 0,
        penebangan: 0,
        jumlah_pohon: 0,
      });
      
      // Clear files
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setFiles([]);
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
    
    // Logika khusus untuk kecamatan: reset kelurahan saat kecamatan berubah
    if (name === "kecamatan") {
      setFormData((prev) => ({
        ...prev,
        kecamatan: value,
        kelurahan: "", // Reset kelurahan saat kecamatan berubah
      }));
    }
    // Cegah user biasa memilih type pemeliharaan
    else if (name === "type") {
      // Jika user bukan admin dan mencoba memilih pemeliharaan, tolak
      if (!isAdmin && value === "pemeliharaan") {
        toast.error("Anda tidak memiliki akses untuk input pemeliharaan");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        type: value as "permohonan" | "pemeliharaan",
        jumlah_pohon: 0,
        pemangkasan: 0,
        penebangan: 0,
      }));
    }
    // Untuk status - hanya admin yang bisa mengubah
    else if (name === "status") {
      if (!isAdmin) {
        toast.error("Anda tidak memiliki akses untuk mengubah status");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        status: value as "pending" | "in_progress" | "completed",
      }));
    }
    else if (name === "jumlah_pohon" && formData.type === "permohonan") {
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
          <h1 className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
            Input Data Pemantauan Pohon
          </h1>
          <p className="text-gray-400">
            Lengkapi form berikut untuk menambahkan data permohonan atau pemeliharaan pohon
          </p>
          
          {/* Role Badge */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 px-6 py-2 rounded-full">
              <div className="w-8 h-8 bg-linear-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-300">
                Login sebagai: <span className="font-medium text-emerald-400">{user?.email}</span>
              </span>
            </div>
            
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-4 py-2 bg-purple-600/20 border border-purple-600 rounded-full text-purple-400 text-sm">
                <Shield className="h-4 w-4" />
                Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600/20 border border-blue-600 rounded-full text-blue-400 text-sm">
                <User className="h-4 w-4" />
                User
              </span>
            )}
          </div>
          
          {/* Warning untuk non-admin */}
          {!isAdmin && (
            <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg inline-flex items-center gap-2 text-yellow-400">
              <Ban className="h-4 w-4" />
              <span className="text-sm">Anda hanya dapat menginput data permohonan dengan status Menunggu</span>
            </div>
          )}
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
                {(["permohonan", "pemeliharaan"] as const).map((type) => {
                  const isDisabled = !isAdmin && type === "pemeliharaan";
                  
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        if (isDisabled) {
                          toast.error("Anda tidak memiliki akses untuk input pemeliharaan");
                          return;
                        }
                        setFormData(prev => ({ ...prev, type, jumlah_pohon: 0, pemangkasan: 0, penebangan: 0 }));
                        if (errors.type) setErrors(prev => ({ ...prev, type: "" }));
                      }}
                      disabled={isDisabled}
                      className={`p-4 rounded-xl border-2 text-center transition-all relative ${
                        formData.type === type && !isDisabled
                          ? getTypeStyle(type)
                          : isDisabled
                          ? "border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-50"
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
                      {isDisabled && (
                        <div className="absolute -top-2 -right-2">
                          <Ban className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.type}
                </p>
              )}
            </div>

            {/* Status - Read-only untuk non-admin */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Status Kegiatan <span className="text-red-400">*</span>
              </label>
              {isAdmin ? (
                // Admin bisa memilih status
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
              ) : (
                // Non-admin hanya bisa melihat status pending (read-only)
                <div className="p-3 rounded-xl border-2 border-yellow-600 bg-yellow-500/10 text-yellow-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏳</span>
                    <span className="font-medium">Menunggu</span>
                  </div>
                  <span className="text-xs text-gray-500">*Tidak dapat diubah</span>
                </div>
              )}
            </div>

            {/* Grid untuk informasi dasar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1 text-emerald-400" />
                  Nama Pemohon/Instansi <span className="text-red-400">*</span>
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

            {/* Kecamatan */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kecamatan <span className="text-red-400">*</span>
              </label>
              <select
                name="kecamatan"
                className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                  errors.kecamatan 
                    ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                    : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                }`}
                onChange={handleChange}
                value={formData.kecamatan}
              >
                <option value="">Pilih Kecamatan</option>
                {Object.keys(dataKelurahan).map((kecamatan) => (
                  <option key={kecamatan} value={kecamatan}>
                    {kecamatan}
                  </option>
                ))}
              </select>
              {errors.kecamatan && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.kecamatan}
                </p>
              )}
            </div>

            {/* Kelurahan */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kelurahan <span className="text-red-400">*</span>
              </label>
              <select
                name="kelurahan"
                className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                  errors.kelurahan 
                    ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                    : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                }`}
                onChange={handleChange}
                value={formData.kelurahan}
                disabled={!formData.kecamatan}
              >
                <option value="">
                  {formData.kecamatan ? "Pilih Kelurahan" : "Pilih Kecamatan Terlebih Dahulu"}
                </option>
                {formData.kecamatan && dataKelurahan[formData.kecamatan]?.map((kelurahan) => (
                  <option key={kelurahan} value={kelurahan}>
                    {kelurahan}
                  </option>
                ))}
              </select>
              {errors.kelurahan && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.kelurahan}
                </p>
              )}
              {formData.kecamatan && (
                <p className="mt-1 text-sm text-gray-500">
                  Menampilkan kelurahan di Kecamatan {formData.kecamatan}
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
                  className="px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
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

            {/* Upload Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Camera className="inline h-4 w-4 mr-1 text-emerald-400" />
                Foto Dokumentasi (Maksimal 5 foto)
              </label>
              
              {/* Area Upload */}
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="foto-upload"
                  disabled={files.length >= 5}
                />
                <label
                  htmlFor="foto-upload"
                  className={`
                    flex flex-col items-center justify-center w-full h-32 
                    border-2 border-dashed rounded-xl cursor-pointer
                    transition-all duration-200
                    ${files.length >= 5 
                      ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' 
                      : 'border-gray-600 hover:border-emerald-500 hover:bg-gray-700/50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`h-8 w-8 mb-2 ${files.length >= 5 ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-400">
                      {files.length >= 5 
                        ? 'Maksimal 5 foto' 
                        : 'Klik untuk upload foto (maksimal 5)'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG (Maks. 5MB per file)
                    </p>
                  </div>
                </label>
              </div>

              {/* Preview Foto */}
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">
                    Preview ({files.length} foto):
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                          <NextImage
                            src={file.preview}
                            alt={`Preview ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Upload Progress */}
                        {file.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={file.uploading}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {/* File Size Indicator */}
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-[10px] bg-black/50 text-white px-1 py-0.5 rounded text-center">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Field untuk Permohonan */}
            {formData.type === "permohonan" && (
              <div className="p-6 bg-linear-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/30 rounded-xl">
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

            {/* Field untuk Pemeliharaan - Hanya untuk Admin */}
            {formData.type === "pemeliharaan" && isAdmin && (
              <div className="p-6 bg-linear-to-br from-green-600/20 to-green-600/5 border border-green-500/30 rounded-xl">
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

            {/* Pesan jika user biasa mencoba akses pemeliharaan (seharusnya tidak terjadi) */}
            {formData.type === "pemeliharaan" && !isAdmin && (
              <div className="p-6 bg-red-600/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-3 text-red-400">
                  <Ban className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">Akses Ditolak</h3>
                    <p className="text-sm">Anda tidak memiliki izin untuk menginput data pemeliharaan.</p>
                  </div>
                </div>
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
                  disabled={uploading || (formData.type === "pemeliharaan" && !isAdmin)}
                  className="flex-1 px-8 py-4 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20"
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
        <Card className="mt-6 p-6 bg-linear-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-400 mb-1">Informasi Penting</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• <span className="font-medium text-blue-400">Permohonan</span>: Jumlah pohon dapat diisi manual (opsional)</li>
                {isAdmin && (
                  <li>• <span className="font-medium text-green-400">Pemeliharaan</span>: Jumlah pohon otomatis terakumulasi dari pemangkasan + penebangan</li>
                )}
                <li>• <span className="font-medium text-emerald-400">Foto</span>: Upload maksimal 5 foto (maks. 5MB per file)</li>
                <li>• Koordinat akan digunakan untuk menampilkan lokasi pada peta</li>
                <li>• Pastikan data yang dimasukkan akurat dan valid</li>
              </ul>
              {!isAdmin && (
                <div className="mt-3 p-2 bg-yellow-600/20 rounded-lg border border-yellow-600/30">
                  <p className="text-xs text-yellow-400">
                    <span className="font-bold">Catatan:</span> Anda hanya dapat menginput data permohonan dengan status "Menunggu". 
                    Untuk input pemeliharaan atau perubahan status, hubungi administrator.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}