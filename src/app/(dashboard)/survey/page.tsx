// app/survey/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { toast } from "sonner";
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
  Info
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import "moment/locale/id";

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
}

interface PermohonanData {
  id: string;
  nama: string;
  perihal: string;
  nomor_surat: string;
  tanggal_surat: string;
  alamat: string;
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

export default function SurveyPage() {
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
    status: "completed" as "pending" | "completed" | "needs_followup"
  });

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
      await fetchPermohonanList();
      setLoading(false);
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
          status: existingSurvey.status || "pending"
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
          status: "completed"
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

    return true;
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
        updated_by: session.user.id
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Memuat data survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Laporan
          </Link>
          
          {selectedPermohonan && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-gray-600">
                ID: <span className="font-mono text-xs">{selectedPermohonan.id}</span>
              </span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Survey Lapangan Pohon
          </h1>
          <p className="text-gray-600">
            Input hasil survey lapangan untuk permohonan yang sudah diajukan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Permohonan List */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Daftar Permohonan
                </h2>
                
                {/* Search and Filter */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari permohonan..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Semua Status</option>
                      <option value="pending">Menunggu</option>
                      <option value="in_progress">Diproses</option>
                      <option value="completed">Selesai</option>
                    </select>
                    <button
                      onClick={fetchPermohonanList}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Permohonan List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredPermohonan.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Tidak ada permohonan ditemukan</p>
                    </div>
                  ) : (
                    filteredPermohonan.map((permohonan) => (
                      <div
                        key={permohonan.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPermohonan?.id === permohonan.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handlePermohonanSelect(permohonan)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {permohonan.nama}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {permohonan.perihal}
                            </p>
                            <div className="flex items-center mt-2 gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                permohonan.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : permohonan.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {permohonan.status === 'completed' ? 'Selesai' : 
                                 permohonan.status === 'in_progress' ? 'Diproses' : 'Menunggu'}
                              </span>
                              {permohonan.jumlah_pohon > 0 && (
                                <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                                  <TreePine className="inline h-3 w-3 mr-1" />
                                  {permohonan.jumlah_pohon} pohon
                                </span>
                              )}
                              {surveyData && selectedPermohonan?.id === permohonan.id && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Sudah Survey
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 text-gray-400 ${
                            selectedPermohonan?.id === permohonan.id ? "text-emerald-500" : ""
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
              <Card className="p-12 text-center h-full flex flex-col items-center justify-center">
                <TreePine className="h-20 w-20 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Pilih Permohonan
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Pilih salah satu permohonan dari daftar di samping untuk mengisi data survey lapangan
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/input"
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Buat Permohonan Baru
                  </Link>
                  <Link
                    href="/laporan"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Lihat Laporan
                  </Link>
                </div>
              </Card>
            ) : (
              <>
                {/* Permohonan Info */}
                <Card className="p-6 mb-6 border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-emerald-800 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Data Permohonan Terpilih
                      </h3>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-emerald-600">Nama Pemohon</p>
                          <p className="font-medium text-gray-900">{selectedPermohonan.nama}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600">Perihal</p>
                          <p className="font-medium text-gray-900">{selectedPermohonan.perihal}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600">Nomor Surat</p>
                          <p className="font-medium text-gray-900">{selectedPermohonan.nomor_surat}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600">Tanggal Surat</p>
                          <p className="font-medium text-gray-900">{formatDate(selectedPermohonan.tanggal_surat)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-emerald-600">Alamat</p>
                          <p className="font-medium text-gray-900">{selectedPermohonan.alamat}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600">Kontak</p>
                          <p className="font-medium text-gray-900">{selectedPermohonan.kontak || '-'}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600">Koordinat</p>
                          <p className="font-mono text-sm text-gray-900">{selectedPermohonan.koordinat}</p>
                        </div>
                      </div>

                      {/* Jumlah Pohon dari Permohonan */}
                      <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <TreePine className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Jumlah Pohon dalam Permohonan
                            </p>
                            <p className="text-3xl font-bold text-emerald-700">
                              {selectedPermohonan.jumlah_pohon || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              * Gunakan sebagai referensi untuk rekomendasi dan catatan survey
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/edit/${selectedPermohonan.id}`}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Edit Data Permohonan"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => setSelectedPermohonan(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Pilih Permohonan Lain"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Survey Form */}
                <Card className="p-6 border-0 shadow-lg">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-emerald-600" />
                      Form Survey Lapangan
                      {surveyData && (
                        <span className="ml-3 px-3 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                          Edit Mode
                        </span>
                      )}
                    </h2>

                    {/* Referensi Jumlah Pohon di Form Survey */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Referensi Permohonan
                          </p>
                          <p className="text-sm text-blue-700">
                            Jumlah pohon yang diajukan: <span className="font-bold">{selectedPermohonan.jumlah_pohon || 0} pohon</span>
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Data ini dapat digunakan sebagai pertimbangan dalam memberikan rekomendasi dan catatan survey.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Survey Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline h-4 w-4 mr-1 text-emerald-600" />
                          Tanggal Survey *
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                          value={formData.survey_date}
                          onChange={(e) => setFormData({...formData, survey_date: e.target.value})}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="inline h-4 w-4 mr-1 text-emerald-600" />
                          Nama Surveyor *
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                          value={formData.surveyor_name}
                          onChange={(e) => setFormData({...formData, surveyor_name: e.target.value})}
                          placeholder="Nama lengkap surveyor"
                          required
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Activity className="inline h-4 w-4 mr-1 text-emerald-600" />
                          Kondisi Pohon *
                        </label>
                        <select
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                          value={formData.condition}
                          onChange={(e) => setFormData({...formData, condition: e.target.value as any})}
                          required
                        >
                          <option value="baik">🌳 Baik</option>
                          <option value="sedang">🌲 Sedang</option>
                          <option value="buruk">🌴 Buruk</option>
                          <option value="rawan_tumbang">⚠️ Rawan Tumbang</option>
                        </select>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <AlertCircle className="inline h-4 w-4 mr-1 text-emerald-600" />
                          Status Survey *
                        </label>
                        <select
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                          required
                        >
                          <option value="completed">✅ Selesai</option>
                          <option value="pending">⏳ Menunggu</option>
                          <option value="needs_followup">🔄 Butuh Tindak Lanjut</option>
                        </select>
                      </div>
                    </div>

                    {/* Tree Measurements */}
                    <div className="p-6 bg-gray-700 rounded-xl">
                      <h3 className="font-semibold text-emerald-800 mb-4 flex items-center">
                        <Ruler className="h-5 w-5 mr-2" />
                        Pengukuran Pohon
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Ruler className="inline h-4 w-4 mr-1 text-emerald-600" />
                            Tinggi (meter)
                          </label>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full pl-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                              value={formData.height}
                              onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value) || 0})}
                              placeholder="0.0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Weight className="inline h-4 w-4 mr-1 text-emerald-600" />
                            Diameter (cm)
                          </label>
                          <div className="relative">
                            <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full pl-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                              value={formData.diameter}
                              onChange={(e) => setFormData({...formData, diameter: parseFloat(e.target.value) || 0})}
                              placeholder="0.0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <ThermometerSun className="inline h-4 w-4 mr-1 text-emerald-600" />
                            Lebar Kanopi (meter)
                          </label>
                          <div className="relative">
                            <ThermometerSun className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="w-full pl-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                              value={formData.canopy_width}
                              onChange={(e) => setFormData({...formData, canopy_width: parseFloat(e.target.value) || 0})}
                              placeholder="0.0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Health Score */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Activity className="inline h-4 w-4 mr-1 text-emerald-600" />
                        Skor Kesehatan: {formData.health_score}/100
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rekomendasi
                          <span className="ml-2 text-xs text-emerald-600">
                            (berdasarkan {selectedPermohonan.jumlah_pohon || 0} pohon)
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                          value={formData.recommendations}
                          onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                          placeholder={`Rekomendasi untuk ${selectedPermohonan.jumlah_pohon || 0} pohon...`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Catatan Tambahan
                          <span className="ml-2 text-xs text-emerald-600">
                            (referensi dari permohonan)
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder={`Catatan survey untuk ${selectedPermohonan.jumlah_pohon || 0} pohon...`}
                        />
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Camera className="inline h-4 w-4 mr-1 text-emerald-600" />
                        Foto Dokumentasi (Maksimal 10 foto)
                      </label>
                      
                      {/* Existing Photos */}
                      {existingPhotos.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Foto yang sudah diupload:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {existingPhotos.map((photo) => (
                              <div key={photo.id} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200">
                                  <img
                                    src={photo.url}
                                    alt={photo.description || "Survey photo"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExistingPhoto(photo.id)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-white bg-black/50 px-2 py-1 rounded truncate">
                                    {moment(photo.created_at).format('DD/MM/YY')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Photo Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
                        <input
                          type="file"
                          id="photo-upload"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-2 font-medium">
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
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Foto baru:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {previewUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-lg border-2 border-emerald-200">
                                  <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-white bg-black/50 px-2 py-1 rounded truncate">
                                    {photos[index].name}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {photos.length} foto siap diupload
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t-2 border-gray-100">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"
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
                          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-200"
                        >
                          <Download className="h-5 w-5" />
                          Download Laporan
                        </button>
                      )}
                      
                      <Link
                        href="/laporan"
                        className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
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