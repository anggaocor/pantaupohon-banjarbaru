// app/survey/page.tsx
'use client'

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import moment from "moment";
import "moment/locale/id";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/client";
import { Card } from "@/src/components/ui";
import {
  Camera,
  Upload,
  FileText,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  TreePine,
  ArrowLeft,
  Edit,
  Save,
  Ruler,
  Weight,
  Activity,
  ThermometerSun,
  ClipboardList,
  User,
  Phone,
  Home,
  Hash,
  Loader2,
  Info,
  Scissors,
  Trash2
} from "lucide-react";

moment.locale('id');

interface SurveyData {
  id: string;
  permohonan_id: string;
  survey_date: string;
  surveyor_name: string;
  condition: 'baik' | 'sedang' | 'buruk' | 'rawan_tumbang';
  height: number;
  diameter: number;
  canopy_width: number;
  health_score: number;
  recommendations: string;
  notes: string;
  status: 'pending' | 'completed' | 'needs_followup';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  jumlah_tebang?: number;
  jumlah_pangkas?: number;
  tindakan?: 'tebang' | 'pangkas' | 'tebang_dan_pangkas' | 'tidak_ada';
}

interface PermohonanData {
  id: string;
  nama: string;
  perihal: string;
  nomor_surat: string;
  tanggal_surat: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  koordinat: string;
  kontak: string;
  type: string;
  keterangan: string;
  status: string;
  jumlah_pohon: number;
  created_at: string;
  updated_at: string;
}

interface SurveyPhoto {
  id: string;
  survey_id: string;
  url: string;
  filename: string;
  description?: string;
  created_at: string;
}

// Komponen utama yang menggunakan useSearchParams
function SurveyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permohonanId = searchParams.get('permohonan');
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [permohonanList, setPermohonanList] = useState<PermohonanData[]>([]);
  const [selectedPermohonan, setSelectedPermohonan] = useState<PermohonanData | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<SurveyPhoto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    survey_date: new Date().toISOString().split('T')[0],
    surveyor_name: "",
    condition: "baik" as "baik" | "sedang" | "buruk" | "rawan_tumbang",
    height: 0,
    diameter: 0,
    canopy_width: 0,
    health_score: 50,
    recommendations: "",
    notes: "",
    status: "completed" as "pending" | "completed" | "needs_followup",
    jumlah_tebang: 0,
    jumlah_pangkas: 0,
    tindakan: "tidak_ada" as "tebang" | "pangkas" | "tebang_dan_pangkas" | "tidak_ada"
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          toast.error("Anda harus login terlebih dahulu");
          router.push("/login");
          return;
        }

        setUser(session.user);
        await fetchPermohonanList();
      } catch (error) {
        console.error("Error checking session:", error);
        toast.error("Terjadi kesalahan saat memeriksa session");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // Auto-select permohonan jika ada ID di URL
  useEffect(() => {
    if (permohonanId && permohonanList.length > 0) {
      const permohonan = permohonanList.find(p => p.id === permohonanId);
      if (permohonan) {
        handlePermohonanSelect(permohonan);
      } else {
        // Jika ID tidak ditemukan, fetch permohonan spesifik
        fetchPermohonanById(permohonanId);
      }
    }
  }, [permohonanId, permohonanList]);

  const fetchPermohonanById = async (id: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pemantauan_pohon")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedPermohonan(data);
        await fetchSurveyData(data.id);
      }
    } catch (error) {
      console.error("Error fetching permohonan:", error);
      toast.error("Permohonan tidak ditemukan");
    }
  };

  const fetchPermohonanList = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pemantauan_pohon")
        .select("*")
        .eq("type", "permohonan")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPermohonanList(data || []);
    } catch (error: any) {
      console.error("Error fetching permohonan:", error);
      toast.error("Gagal memuat data permohonan");
    }
  };

  const fetchSurveyData = async (permohonanId: string) => {
    try {
      const supabase = createClient();
      
      // Check if survey already exists
      const { data: existingSurvey, error: surveyError } = await supabase
        .from("survey_lapangan")
        .select("*")
        .eq("permohonan_id", permohonanId)
        .maybeSingle();

      if (surveyError) {
        console.error("Error fetching survey:", surveyError);
      }

      if (existingSurvey) {
        setSurveyData(existingSurvey);
        setFormData({
          survey_date: existingSurvey.survey_date.split('T')[0],
          surveyor_name: existingSurvey.surveyor_name || "",
          condition: existingSurvey.condition || "baik",
          height: existingSurvey.height || 0,
          diameter: existingSurvey.diameter || 0,
          canopy_width: existingSurvey.canopy_width || 0,
          health_score: existingSurvey.health_score || 50,
          recommendations: existingSurvey.recommendations || "",
          notes: existingSurvey.notes || "",
          status: existingSurvey.status || "pending",
          jumlah_tebang: existingSurvey.jumlah_tebang || 0,
          jumlah_pangkas: existingSurvey.jumlah_pangkas || 0,
          tindakan: existingSurvey.tindakan || "tidak_ada"
        });

        // Fetch existing photos
        const { data: photos, error: photosError } = await supabase
          .from("survey_photos")
          .select("*")
          .eq("survey_id", existingSurvey.id)
          .order("created_at", { ascending: false });

        if (!photosError && photos) {
          setExistingPhotos(photos);
        }
      } else {
        setSurveyData(null);
        setExistingPhotos([]);
        // Reset form to default values
        setFormData({
          survey_date: new Date().toISOString().split('T')[0],
          surveyor_name: "",
          condition: "baik",
          height: 0,
          diameter: 0,
          canopy_width: 0,
          health_score: 50,
          recommendations: "",
          notes: "",
          status: "completed",
          jumlah_tebang: 0,
          jumlah_pangkas: 0,
          tindakan: "tidak_ada"
        });
      }
    } catch (error) {
      console.error("Error in fetchSurveyData:", error);
    }
  };

  const handlePermohonanSelect = (permohonan: PermohonanData) => {
    setSelectedPermohonan(permohonan);
    fetchSurveyData(permohonan.id);
    setPhotos([]);
    setPreviewUrls([]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limit to 10 files
    if (files.length + photos.length > 10) {
      toast.error("Maksimal 10 foto yang dapat diunggah");
      return;
    }

    // Validate file types and size
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format gambar yang valid`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar (maksimal 5MB)`);
        return false;
      }
      
      return true;
    });

    setPhotos(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = async (photoId: string) => {
    try {
      const supabase = createClient();
      
      // Get photo URL to delete from storage
      const { data: photo, error: fetchError } = await supabase
        .from("survey_photos")
        .select("filename")
        .eq("id", photoId)
        .single();

      if (fetchError) {
        console.error("Error fetching photo:", fetchError);
        throw fetchError;
      }

      if (photo) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from("survey-photos")
          .remove([photo.filename]);

        if (storageError) {
          console.error("Error deleting from storage:", storageError);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("survey_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success("Foto berhasil dihapus");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Gagal menghapus foto");
    }
  };

  const validateForm = () => {
    if (!selectedPermohonan) {
      toast.error("Pilih permohonan terlebih dahulu");
      return false;
    }

    if (!formData.surveyor_name.trim()) {
      toast.error("Nama surveyor wajib diisi");
      return false;
    }

    if (formData.health_score < 0 || formData.health_score > 100) {
      toast.error("Skor kesehatan harus antara 0-100");
      return false;
    }

    // Validasi jumlah tebang dan pangkas
    if (formData.jumlah_tebang < 0 || formData.jumlah_pangkas < 0) {
      toast.error("Jumlah pohon tidak boleh negatif");
      return false;
    }

    const totalTindakan = formData.jumlah_tebang + formData.jumlah_pangkas;
    if (totalTindakan > (selectedPermohonan?.jumlah_pohon || 0)) {
      toast.error(`Total pohon yang ditindak (${totalTindakan}) melebihi jumlah pohon dalam permohonan (${selectedPermohonan?.jumlah_pohon})`);
      return false;
    }

    return true;
  };

  // Fungsi untuk mengupdate tindakan berdasarkan jumlah tebang dan pangkas
  const updateTindakan = (tebang: number, pangkas: number) => {
    if (tebang > 0 && pangkas > 0) {
      return "tebang_dan_pangkas";
    } else if (tebang > 0) {
      return "tebang";
    } else if (pangkas > 0) {
      return "pangkas";
    } else {
      return "tidak_ada";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast.error("Session tidak valid, silakan login ulang");
        router.push("/login");
        return;
      }

      // Update tindakan berdasarkan jumlah tebang dan pangkas
      const tindakan = updateTindakan(formData.jumlah_tebang, formData.jumlah_pangkas);

      // Prepare data for insert/update
      const surveyDataToSave = {
        permohonan_id: selectedPermohonan!.id,
        survey_date: new Date(formData.survey_date).toISOString(),
        surveyor_name: formData.surveyor_name.trim(),
        condition: formData.condition,
        height: formData.height || 0,
        diameter: formData.diameter || 0,
        canopy_width: formData.canopy_width || 0,
        health_score: formData.health_score || 50,
        recommendations: formData.recommendations?.trim() || null,
        notes: formData.notes?.trim() || null,
        status: formData.status,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
        jumlah_tebang: formData.jumlah_tebang || 0,
        jumlah_pangkas: formData.jumlah_pangkas || 0,
        tindakan: tindakan
      };

      let surveyId: string;

      if (surveyData) {
        // Update existing survey
        const { data, error } = await supabase
          .from("survey_lapangan")
          .update(surveyDataToSave)
          .eq("id", surveyData.id)
          .select()
          .single();

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        
        surveyId = surveyData.id;
        toast.success("Data survey berhasil diperbarui");
      } else {
        // Create new survey with created_by
        const { data, error } = await supabase
          .from("survey_lapangan")
          .insert({
            ...surveyDataToSave,
            created_at: new Date().toISOString(),
            created_by: session.user.id
          })
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        
        surveyId = data.id;
        toast.success("Data survey berhasil disimpan");
      }

      // Update permohonan status
      const { error: updatePermohonanError } = await supabase
        .from("pemantauan_pohon")
        .update({ 
          status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedPermohonan!.id);

      if (updatePermohonanError) {
        console.error("Error updating permohonan status:", updatePermohonanError);
        // Don't throw, just log - survey already saved
      }

      // Upload photos
      if (photos.length > 0) {
        let uploadSuccess = true;
        
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${surveyId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          try {
            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from("survey-photos")
              .upload(fileName, file);

            if (uploadError) {
              console.error(`Error uploading file ${file.name}:`, uploadError);
              uploadSuccess = false;
              continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from("survey-photos")
              .getPublicUrl(fileName);

            // Save to database
            const { error: dbError } = await supabase
              .from("survey_photos")
              .insert({
                survey_id: surveyId,
                url: publicUrl,
                filename: fileName,
                description: `Foto survey ${i + 1}`,
                uploaded_by: session.user.id,
                created_at: new Date().toISOString()
              });

            if (dbError) {
              console.error(`Error saving file ${file.name} to database:`, dbError);
              uploadSuccess = false;
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            uploadSuccess = false;
          }
        }

        if (uploadSuccess) {
          toast.success(`${photos.length} foto berhasil diunggah`);
        } else {
          toast.warning("Beberapa foto gagal diunggah, tetapi data survey tetap tersimpan");
        }
      }

      // Refresh data
      await fetchSurveyData(selectedPermohonan!.id);
      setPhotos([]);
      setPreviewUrls([]);

    } catch (error: any) {
      console.error("Error saving survey:", error);
      
      // Menampilkan pesan error yang lebih informatif
      if (error.code === '23503') {
        toast.error("Gagal menyimpan: Data referensi tidak ditemukan");
      } else if (error.code === '23502') {
        toast.error("Gagal menyimpan: Ada field wajib yang kosong");
      } else if (error.message) {
        toast.error(`Gagal menyimpan data survey: ${error.message}`);
      } else {
        toast.error("Gagal menyimpan data survey");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!surveyData) return;
    
    const totalTindakan = formData.jumlah_tebang + formData.jumlah_pangkas;
    const sisaPohon = (selectedPermohonan?.jumlah_pohon || 0) - totalTindakan;
    
    const report = `
LAPORAN SURVEY LAPANGAN
======================
Tanggal: ${moment().format('DD MMMM YYYY HH:mm')}

DATA PERMOHONAN
----------------
Nama: ${selectedPermohonan?.nama}
Perihal: ${selectedPermohonan?.perihal}
Nomor Surat: ${selectedPermohonan?.nomor_surat}
Tanggal Surat: ${moment(selectedPermohonan?.tanggal_surat).format('DD MMMM YYYY')}
Alamat: ${selectedPermohonan?.alamat}
Kecamatan: ${selectedPermohonan?.kecamatan || '-'}
Kelurahan: ${selectedPermohonan?.kelurahan || '-'}
Kontak: ${selectedPermohonan?.kontak || '-'}
Jumlah Pohon dalam Permohonan: ${selectedPermohonan?.jumlah_pohon || 0} pohon

DATA SURVEY
-----------
Tanggal Survey: ${moment(formData.survey_date).format('DD MMMM YYYY')}
Surveyor: ${formData.surveyor_name}
Kondisi Pohon: ${formData.condition}

PENGUKURAN
----------
Tinggi: ${formData.height} meter
Diameter: ${formData.diameter} cm
Lebar Kanopi: ${formData.canopy_width} meter
Skor Kesehatan: ${formData.health_score}/100

TINDAKAN YANG DILAKUKAN
-----------------------
Jumlah Pohon ditebang: ${formData.jumlah_tebang} pohon
Jumlah Pohon dipangkas: ${formData.jumlah_pangkas} pohon
Total Tindakan: ${totalTindakan} pohon
Sisa Pohon: ${sisaPohon} pohon
Status Tindakan: ${formData.tindakan === 'tebang' ? 'Penebangan' : 
                   formData.tindakan === 'pangkas' ? 'Pemangkasan' :
                   formData.tindakan === 'tebang_dan_pangkas' ? 'Penebangan dan Pemangkasan' : 
                   'Tidak Ada Tindakan'}

REKOMENDASI
-----------
${formData.recommendations || '-'}

CATATAN
-------
${formData.notes || '-'}

DOKUMENTASI
-----------
Total Foto: ${existingPhotos.length + photos.length}

Status Survey: ${formData.status === 'completed' ? 'Selesai' : 
                 formData.status === 'pending' ? 'Menunggu' : 'Butuh Tindak Lanjut'}

Dilaporkan oleh: ${user?.email}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey-${selectedPermohonan?.nomor_surat || 'report'}-${moment().format('YYYYMMDD')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Laporan berhasil didownload");
  };

  const filteredPermohonan = permohonanList.filter(permohonan => {
    const matchesSearch = 
      permohonan.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permohonan.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permohonan.nomor_surat.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || permohonan.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return moment(dateString).format('DD MMMM YYYY');
  };

  // Hitung total tindakan dan sisa pohon
  const totalTindakan = formData.jumlah_tebang + formData.jumlah_pangkas;
  const sisaPohon = (selectedPermohonan?.jumlah_pohon || 0) - totalTindakan;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-emerald-900 to-teal-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-3"></div>
          <p className="text-emerald-200">Memuat data survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-emerald-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Laporan
          </Link>
          
          {selectedPermohonan && (
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700">
              <ClipboardList className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-gray-300">
                ID: <span className="font-mono text-xs text-emerald-400">{selectedPermohonan?.id}</span>
              </span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Survey Lapangan Pohon
          </h1>
          <p className="text-gray-400">
            Input hasil survey lapangan untuk permohonan yang sudah diajukan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Permohonan List */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-emerald-400" />
                  Daftar Permohonan
                </h2>
                
                {/* Search and Filter */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Cari permohonan..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all" className="bg-gray-800">Semua Status</option>
                      <option value="pending" className="bg-gray-800">Menunggu</option>
                      <option value="in_progress" className="bg-gray-800">Diproses</option>
                      <option value="completed" className="bg-gray-800">Selesai</option>
                    </select>
                    <button
                      onClick={fetchPermohonanList}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
                      title="Refresh"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Permohonan List */}
                <div className="space-y-3 max-h-125 overflow-y-auto">
                  {filteredPermohonan.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                      <p>Tidak ada permohonan ditemukan</p>
                    </div>
                  ) : (
                    filteredPermohonan.map((permohonan) => (
                      <div
                        key={permohonan.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPermohonan?.id === permohonan.id
                            ? "border-emerald-500 bg-emerald-900/20"
                            : "border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50"
                        }`}
                        onClick={() => handlePermohonanSelect(permohonan)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-white truncate">
                              {permohonan.nama}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {permohonan.perihal}
                            </p>
                            <div className="flex items-center mt-2 gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                permohonan.status === 'completed' 
                                  ? 'bg-green-900/50 text-green-300 border border-green-700'
                                  : permohonan.status === 'in_progress'
                                  ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                                  : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                              }`}>
                                {permohonan.status === 'completed' ? 'Selesai' : 
                                 permohonan.status === 'in_progress' ? 'Diproses' : 'Menunggu'}
                              </span>
                              {permohonan.jumlah_pohon > 0 && (
                                <span className="px-2 py-1 text-xs bg-emerald-900/50 text-emerald-300 rounded-full border border-emerald-700">
                                  <TreePine className="inline h-3 w-3 mr-1" />
                                  {permohonan.jumlah_pohon} pohon
                                </span>
                              )}
                              {surveyData && selectedPermohonan?.id === permohonan.id && (
                                <span className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded-full border border-green-700">
                                  Sudah Survey
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 ${
                            selectedPermohonan?.id === permohonan.id ? "text-emerald-400" : "text-gray-600"
                          }`} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Survey Form */}
          <div className="lg:col-span-2">
            {!selectedPermohonan ? (
              <Card className="p-12 text-center h-full flex flex-col items-center justify-center bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <TreePine className="h-20 w-20 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Pilih Permohonan
                </h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  Pilih salah satu permohonan dari daftar di samping untuk mengisi data survey lapangan
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/input"
                    className="px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors"
                  >
                    Buat Permohonan Baru
                  </Link>
                  <Link
                    href="/laporan"
                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Lihat Laporan
                  </Link>
                </div>
              </Card>
            ) : (
              <>
                {/* Permohonan Info */}
                <Card className="p-6 mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-emerald-400 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Data Permohonan Terpilih
                      </h3>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-emerald-500">Nama Pemohon</p>
                          <p className="font-medium text-white">{selectedPermohonan?.nama}</p>
                        </div>
                        <div>
                          <p className="text-emerald-500">Perihal</p>
                          <p className="font-medium text-white">{selectedPermohonan?.perihal}</p>
                        </div>
                        <div>
                          <p className="text-emerald-500">Nomor Surat</p>
                          <p className="font-medium text-white">{selectedPermohonan?.nomor_surat}</p>
                        </div>
                        <div>
                          <p className="text-emerald-500">Tanggal Surat</p>
                          <p className="font-medium text-white">{formatDate(selectedPermohonan?.tanggal_surat || '-')}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-emerald-500">Alamat</p>
                          <p className="font-medium text-white">{selectedPermohonan?.alamat}</p>
                        </div>
                        <div>
                          <p className="text-emerald-500">Kontak</p>
                          <p className="font-medium text-white">{selectedPermohonan?.kontak || '-'}</p>
                        </div>
                        <div>
                          <p className="text-emerald-500">Koordinat</p>
                          <p className="font-mono text-sm text-white">{selectedPermohonan?.koordinat}</p>
                        </div>
                      </div>

                      {/* Jumlah Pohon dari Permohonan */}
                      <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-emerald-800">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-900/50 rounded-lg">
                            <TreePine className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-400 mb-1">
                              Jumlah Pohon dalam Permohonan
                            </p>
                            <p className="text-3xl font-bold text-emerald-400">
                              {selectedPermohonan?.jumlah_pohon || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              * Gunakan sebagai referensi untuk tindakan yang akan dilakukan
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/edit/${selectedPermohonan?.id}`}
                        className="p-2 text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors"
                        title="Edit Data Permohonan"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => setSelectedPermohonan(null)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Pilih Permohonan Lain"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Survey Form */}
                <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-emerald-400" />
                      Form Survey Lapangan
                      {surveyData && (
                        <span className="ml-3 px-3 py-1 text-xs bg-emerald-900/50 text-emerald-300 rounded-full border border-emerald-700">
                          Edit Mode
                        </span>
                      )}
                    </h2>

                    {/* Referensi Jumlah Pohon di Form Survey */}
                    <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-800 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-300">
                            Referensi Permohonan
                          </p>
                          <p className="text-sm text-blue-400">
                            Jumlah pohon yang diajukan: <span className="font-bold">{selectedPermohonan?.jumlah_pohon || 0} pohon</span>
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            Data ini dapat digunakan sebagai pertimbangan dalam menentukan tindakan yang akan dilakukan.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Survey Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Calendar className="inline h-4 w-4 mr-1 text-emerald-400" />
                          Tanggal Survey *
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white"
                          value={formData.survey_date}
                          onChange={(e) => setFormData({...formData, survey_date: e.target.value})}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <User className="inline h-4 w-4 mr-1 text-emerald-400" />
                          Nama Surveyor *
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                          value={formData.surveyor_name}
                          onChange={(e) => setFormData({...formData, surveyor_name: e.target.value})}
                          placeholder="Nama lengkap surveyor"
                          required
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Activity className="inline h-4 w-4 mr-1 text-emerald-400" />
                          Kondisi Pohon *
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white"
                          value={formData.condition}
                          onChange={(e) => setFormData({...formData, condition: e.target.value as any})}
                          required
                        >
                          <option value="baik" className="bg-gray-800">🌳 Baik</option>
                          <option value="sedang" className="bg-gray-800">🌲 Sedang</option>
                          <option value="buruk" className="bg-gray-800">🌴 Buruk</option>
                          <option value="rawan_tumbang" className="bg-gray-800">⚠️ Rawan Tumbang</option>
                        </select>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <AlertCircle className="inline h-4 w-4 mr-1 text-emerald-400" />
                          Status Survey *
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                          required
                        >
                          <option value="completed" className="bg-gray-800">✅ Selesai</option>
                          <option value="pending" className="bg-gray-800">⏳ Menunggu</option>
                          <option value="needs_followup" className="bg-gray-800">🔄 Butuh Tindak Lanjut</option>
                        </select>
                      </div>
                    </div>

                    {/* Tree Measurements */}
                    <div className="p-6 bg-gray-700/30 rounded-xl">
                      <h3 className="font-semibold text-emerald-400 mb-4 flex items-center">
                        <Ruler className="h-5 w-5 mr-2" />
                        Pengukuran Pohon
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Ruler className="inline h-4 w-4 mr-1 text-emerald-400" />
                            Tinggi (meter)
                          </label>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full pl-10 px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                              value={formData.height}
                              onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value) || 0})}
                              placeholder="0.0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Weight className="inline h-4 w-4 mr-1 text-emerald-400" />
                            Diameter (cm)
                          </label>
                          <div className="relative">
                            <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full pl-10 px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                              value={formData.diameter}
                              onChange={(e) => setFormData({...formData, diameter: parseFloat(e.target.value) || 0})}
                              placeholder="0.0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <ThermometerSun className="inline h-4 w-4 mr-1 text-emerald-400" />
                            Lebar Kanopi (meter)
                          </label>
                          <div className="relative">
                            <ThermometerSun className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full pl-10 px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                              value={formData.canopy_width}
                              onChange={(e) => setFormData({...formData, canopy_width: parseFloat(e.target.value) || 0})}
                              placeholder="0.0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Jumlah Pohon yang Ditindak */}
                    <div className="p-6 bg-orange-900/20 rounded-xl border-2 border-orange-800">
                      <h3 className="font-semibold text-orange-300 mb-4 flex items-center">
                        <Trash2 className="h-5 w-5 mr-2" />
                        Tindakan yang Dilakukan
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Trash2 className="inline h-4 w-4 mr-1 text-red-400" />
                            Jumlah Pohon Ditebang
                          </label>
                          <div className="relative">
                            <Trash2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                              type="number"
                              min="0"
                              max={selectedPermohonan?.jumlah_pohon || 0}
                              className="w-full pl-10 px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-white placeholder-gray-500"
                              value={formData.jumlah_tebang}
                              onChange={(e) => {
                                const tebang = parseInt(e.target.value) || 0;
                                setFormData({
                                  ...formData, 
                                  jumlah_tebang: Math.min(tebang, selectedPermohonan?.jumlah_pohon || 0),
                                  tindakan: updateTindakan(tebang, formData.jumlah_pangkas)
                                });
                              }}
                              placeholder="0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Maksimal {selectedPermohonan?.jumlah_pohon || 0} pohon
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Scissors className="inline h-4 w-4 mr-1 text-orange-400" />
                            Jumlah Pohon Dipangkas
                          </label>
                          <div className="relative">
                            <Scissors className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                              type="number"
                              min="0"
                              max={selectedPermohonan?.jumlah_pohon || 0}
                              className="w-full pl-10 px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-white placeholder-gray-500"
                              value={formData.jumlah_pangkas}
                              onChange={(e) => {
                                const pangkas = parseInt(e.target.value) || 0;
                                setFormData({
                                  ...formData, 
                                  jumlah_pangkas: Math.min(pangkas, selectedPermohonan?.jumlah_pohon || 0),
                                  tindakan: updateTindakan(formData.jumlah_tebang, pangkas)
                                });
                              }}
                              placeholder="0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Maksimal {selectedPermohonan?.jumlah_pohon || 0} pohon
                          </p>
                        </div>
                      </div>

                      {/* Ringkasan Tindakan */}
                      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-red-900/30 rounded-lg border border-red-800">
                            <p className="text-sm text-red-300 font-medium">Ditebang</p>
                            <p className="text-2xl font-bold text-red-400">{formData.jumlah_tebang}</p>
                          </div>
                          <div className="text-center p-3 bg-orange-900/30 rounded-lg border border-orange-800">
                            <p className="text-sm text-orange-300 font-medium">Dipangkas</p>
                            <p className="text-2xl font-bold text-orange-400">{formData.jumlah_pangkas}</p>
                          </div>
                          <div className="text-center p-3 bg-green-900/30 rounded-lg border border-green-800">
                            <p className="text-sm text-green-300 font-medium">Sisa</p>
                            <p className="text-2xl font-bold text-green-400">{sisaPohon}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                            formData.tindakan === 'tebang' ? 'bg-red-900/30 text-red-300 border-red-700' :
                            formData.tindakan === 'pangkas' ? 'bg-orange-900/30 text-orange-300 border-orange-700' :
                            formData.tindakan === 'tebang_dan_pangkas' ? 'bg-purple-900/30 text-purple-300 border-purple-700' :
                            'bg-gray-700 text-gray-300 border-gray-600'
                          }`}>
                            {formData.tindakan === 'tebang' && '🔴 Penebangan'}
                            {formData.tindakan === 'pangkas' && '🟠 Pemangkasan'}
                            {formData.tindakan === 'tebang_dan_pangkas' && '🟣 Penebangan & Pemangkasan'}
                            {formData.tindakan === 'tidak_ada' && '⚪ Tidak Ada Tindakan'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Health Score */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Activity className="inline h-4 w-4 mr-1 text-emerald-400" />
                        Skor Kesehatan: {formData.health_score}/100
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        value={formData.health_score}
                        onChange={(e) => setFormData({...formData, health_score: parseInt(e.target.value)})}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Buruk</span>
                        <span>Sedang</span>
                        <span>Baik</span>
                      </div>
                    </div>

                    {/* Recommendations and Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Rekomendasi
                          <span className="ml-2 text-xs text-emerald-500">
                            (berdasarkan {selectedPermohonan?.jumlah_pohon || 0} pohon)
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                          value={formData.recommendations}
                          onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                          placeholder={`Rekomendasi untuk ${selectedPermohonan?.jumlah_pohon || 0} pohon...`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Catatan Tambahan
                          <span className="ml-2 text-xs text-emerald-500">
                            (referensi dari permohonan)
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder={`Catatan survey untuk ${selectedPermohonan?.jumlah_pohon || 0} pohon...`}
                        />
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Camera className="inline h-4 w-4 mr-1 text-emerald-400" />
                        Foto Dokumentasi (Maksimal 10 foto)
                      </label>
                      
                      {/* Existing Photos */}
                      {existingPhotos.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Foto yang sudah diupload:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {existingPhotos.map((photo) => (
                              <div key={photo.id} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-700">
                                  <img
                                    src={photo.url}
                                    alt={photo.description || "Survey photo"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExistingPhoto(photo.id)}
                                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-white bg-black/70 px-2 py-1 rounded truncate">
                                    {moment(photo.created_at).format('DD/MM/YY')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Photo Upload */}
                      <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
                        <input
                          type="file"
                          id="photo-upload"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Upload className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-300 mb-2 font-medium">
                            Klik atau drag & drop foto di sini
                          </p>
                          <p className="text-xs text-gray-500">
                            Format: JPG, PNG, WebP (maksimal 5MB per file)
                          </p>
                        </label>
                      </div>

                      {/* Photo Previews */}
                      {previewUrls.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Foto baru:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {previewUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-lg border-2 border-emerald-700">
                                  <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-white bg-black/70 px-2 py-1 rounded truncate">
                                    {photos[index].name}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-400 mt-2">
                            {photos.length} foto siap diupload
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t-2 border-gray-700">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="px-8 py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            {surveyData ? "Update Survey" : "Simpan Survey"}
                          </>
                        )}
                      </button>
                      
                      {surveyData && (
                        <button
                          type="button"
                          onClick={handleDownloadReport}
                          className="px-8 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30"
                        >
                          <Download className="h-5 w-5" />
                          Download Laporan
                        </button>
                      )}
                      
                      <Link
                        href="/laporan"
                        className="px-8 py-3 border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        Kembali ke Laporan
                      </Link>
                    </div>
                  </form>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen utama dengan Suspense
export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-emerald-900 to-teal-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-3"></div>
          <p className="text-emerald-200">Memuat halaman survey...</p>
        </div>
      </div>
    }>
      <SurveyPageContent />
    </Suspense>
  );
}