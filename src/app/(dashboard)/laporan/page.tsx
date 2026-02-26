// app/laporan/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/src/components/ui";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  RefreshCw,
  Printer,
  User,
  Phone,
  BarChart3,
  Clock,
  Scissors,
  Axe,
  TreePine,
  ClipboardList
} from "lucide-react";
import moment from "moment";
import "moment/locale/id";
import Link from "next/link";

moment.locale('id');

interface PermohonanData {
  id: string;
  nama: string;
  perihal: string;
  nomor_surat: string;
  tanggal_surat: string;
  alamat: string;
  koordinat: string;
  kontak: string;
  type: 'permohonan' | 'pemeliharaan';
  keterangan: string;
  status: 'pending' | 'in_progress' | 'completed';
  jumlah_pohon: number;
  pemangkasan: number;
  penebangan: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

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
}

interface SurveyPhoto {
  id: string;
  survey_id: string;
  url: string;
  filename: string;
  description?: string;
  created_at: string;
}

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
}

export default function LaporanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PermohonanData[]>([]);
  const [surveys, setSurveys] = useState<Record<string, SurveyData>>({});
  const [photos, setPhotos] = useState<Record<string, SurveyPhoto[]>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermohonanData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PermohonanData | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyData | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SurveyPhoto[]>([]);

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
      await fetchData();
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch pemantauan_pohon data
      const { data: permohonanData, error: permohonanError } = await supabase
        .from("pemantauan_pohon")
        .select("*")
        .order("created_at", { ascending: false });

      if (permohonanError) throw permohonanError;

      setData(permohonanData || []);

      // Fetch profile data for each permohonan
      const userIds = [...new Set(permohonanData?.map(item => item.user_id) || [])];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        if (profileData) {
          const profileMap: Record<string, ProfileData> = {};
          profileData.forEach(profile => {
            profileMap[profile.id] = profile;
          });
          setProfiles(profileMap);
        }
      }

      // Fetch survey data for permohonan that have surveys
      const permohonanIds = permohonanData?.map(item => item.id) || [];
      if (permohonanIds.length > 0) {
        const { data: surveyData, error: surveyError } = await supabase
          .from("survey_lapangan")
          .select("*")
          .in("permohonan_id", permohonanIds);

        if (!surveyError && surveyData) {
          const surveyMap: Record<string, SurveyData> = {};
          surveyData.forEach(survey => {
            surveyMap[survey.permohonan_id] = survey;
          });
          setSurveys(surveyMap);

          // Fetch photos for surveys
          const surveyIds = surveyData.map(s => s.id);
          if (surveyIds.length > 0) {
            const { data: photoData } = await supabase
              .from("survey_photos")
              .select("*")
              .in("survey_id", surveyIds);

            if (photoData) {
              const photoMap: Record<string, SurveyPhoto[]> = {};
              photoData.forEach(photo => {
                const survey = surveyData.find(s => s.id === photo.survey_id);
                if (survey) {
                  if (!photoMap[survey.permohonan_id]) {
                    photoMap[survey.permohonan_id] = [];
                  }
                  photoMap[survey.permohonan_id].push(photo);
                }
              });
              setPhotos(photoMap);
            }
          }
        }
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const supabase = createClient();

      // Check if survey exists for this permohonan
      const survey = surveys[itemToDelete.id];
      if (survey) {
        // Delete survey photos first
        const existingPhotos = photos[itemToDelete.id] || [];
        for (const photo of existingPhotos) {
          await supabase.storage
            .from("survey-photos")
            .remove([photo.filename]);
        }

        // Delete survey photos from database
        await supabase
          .from("survey_photos")
          .delete()
          .eq("survey_id", survey.id);

        // Delete survey
        await supabase
          .from("survey_lapangan")
          .delete()
          .eq("permohonan_id", itemToDelete.id);
      }

      // Delete permohonan
      const { error } = await supabase
        .from("pemantauan_pohon")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;

      toast.success("Data berhasil dihapus");
      setShowDeleteModal(false);
      setItemToDelete(null);
      await fetchData();

    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const handleEdit = (item: PermohonanData) => {
    if (item.type === 'permohonan') {
      // Untuk permohonan, arahkan ke halaman survey dengan parameter ID
      router.push(`/survey?permohonan=${item.id}`);
    } else {
      // Untuk pemeliharaan, arahkan ke halaman edit biasa
      router.push(`/edit/${item.id}`);
    }
  };

  const handleViewDetail = (item: PermohonanData) => {
    setSelectedItem(item);
    setSelectedSurvey(surveys[item.id] || null);
    setSelectedPhotos(photos[item.id] || []);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          text: 'Selesai',
          className: 'bg-green-100 text-green-800'
        };
      case 'in_progress':
        return {
          text: 'Diproses',
          className: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          text: 'Menunggu',
          className: 'bg-yellow-100 text-yellow-800'
        };
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      permohonan: 'bg-blue-100 text-blue-800',
      pemeliharaan: 'bg-green-100 text-green-800',
    };

    const labels: Record<string, string> = {
      permohonan: 'Permohonan',
      pemeliharaan: 'Pemeliharaan',
    };

    return {
      text: labels[type] || type,
      className: colors[type] || 'bg-gray-100 text-gray-800'
    };
  };

  const getConditionBadge = (condition?: string) => {
    switch (condition) {
      case 'baik':
        return {
          text: 'Baik',
          className: 'bg-green-100 text-green-800'
        };
      case 'sedang':
        return {
          text: 'Sedang',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'buruk':
        return {
          text: 'Buruk',
          className: 'bg-red-100 text-red-800'
        };
      case 'rawan_tumbang':
        return {
          text: 'Rawan Tumbang',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          text: 'Belum Survey',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).format('DD MMM YYYY');
  };

  const formatDateTime = (dateString: string) => {
    return moment(dateString).format('DD MMM YYYY HH:mm');
  };

  const getProcessStatus = (item: PermohonanData) => {
    if (item.type === 'permohonan') {
      const survey = surveys[item.id];
      if (survey) {
        return {
          text: 'Telah Disurvey',
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          className: 'text-green-600'
        };
      }
      return {
        text: 'Belum Survey',
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        className: 'text-yellow-600'
      };
    }
    return {
      text: 'Kegiatan Pemeliharaan',
      icon: <TreePine className="h-4 w-4 text-green-500" />,
      className: 'text-green-600'
    };
  };

  const getPohonInfo = (item: PermohonanData) => {
    if (item.type === 'pemeliharaan') {
      return {
        dipangkas: item.pemangkasan || 0,
        ditebang: item.penebangan || 0,
        total: (item.pemangkasan || 0) + (item.penebangan || 0)
      };
    }
    return {
      dipangkas: 0,
      ditebang: 0,
      total: item.jumlah_pohon || 0
    };
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = searchTerm === "" ||
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomor_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alamat.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || item.type === filterType;

      // Status filter
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;

      // Date range filter
      const matchesDate = !dateRange.start || !dateRange.end ||
        (new Date(item.created_at) >= new Date(dateRange.start) &&
         new Date(item.created_at) <= new Date(dateRange.end));

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [data, searchTerm, filterType, filterStatus, dateRange]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    const headers = [
      'Nama',
      'Perihal',
      'Nomor Surat',
      'Tanggal Surat',
      'Tipe',
      'Status',
      'Alamat',
      'Koordinat',
      'Kontak',
      'Jumlah Pohon',
      'Pemangkasan',
      'Penebangan',
      'Tanggal Dibuat',
      'Proses',
      'Kondisi Pohon',
      'Surveyor',
      'Tanggal Survey'
    ];

    const rows = filteredData.map(item => {
      const survey = surveys[item.id];
      const process = getProcessStatus(item);
      const condition = survey ? survey.condition : 'Belum Survey';
      const pohonInfo = getPohonInfo(item);
      
      return [
        item.nama,
        item.perihal,
        item.nomor_surat,
        formatDate(item.tanggal_surat),
        getTypeBadge(item.type).text,
        getStatusBadge(item.status).text,
        item.alamat,
        item.koordinat,
        item.kontak || '-',
        pohonInfo.total,
        pohonInfo.dipangkas,
        pohonInfo.ditebang,
        formatDate(item.created_at),
        process.text,
        getConditionBadge(condition).text,
        survey?.surveyor_name || '-',
        survey ? formatDate(survey.survey_date) : '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-pemantauan-pohon-${moment().format('YYYY-MM-DD')}.csv`;
    link.click();
    toast.success('Data berhasil diexport ke CSV');
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Laporan Data Pemantauan Pohon
              </h1>
              <p className="text-gray-600">
                Monitoring dan tracking semua data permohonan dan pemeliharaan pohon
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={printReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-blue-50 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Data</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Pemeliharaan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.filter(item => item.type === 'pemeliharaan').length}
                </p>
              </div>
              <TreePine className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 bg-yellow-50 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Permohonan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.filter(item => item.type === 'permohonan').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Telah Disurvey</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(surveys).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                Pencarian
              </label>
              <input
                type="text"
                placeholder="Cari nama, perihal, nomor surat..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Tipe Kegiatan
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Semua Tipe</option>
                <option value="permohonan">Permohonan</option>
                <option value="pemeliharaan">Pemeliharaan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="in_progress">Diproses</option>
                <option value="completed">Selesai</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-gray-600">
                  Menampilkan <span className="font-semibold">{filteredData.length}</span> dari{' '}
                  <span className="font-semibold">{data.length}</span> data
                </span>
              </div>
              {(filterType !== "all" || filterStatus !== "all" || dateRange.start || dateRange.end) && (
                <button
                  onClick={() => {
                    setFilterType("all");
                    setFilterStatus("all");
                    setDateRange({ start: "", end: "" });
                    setSearchTerm("");
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Informasi Permohonan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Proses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Pohon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Tidak ada data ditemukan</p>
                      {filteredData.length === 0 && data.length > 0 && (
                        <button
                          onClick={() => {
                            setFilterType("all");
                            setFilterStatus("all");
                            setDateRange({ start: "", end: "" });
                            setSearchTerm("");
                          }}
                          className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Reset filter untuk melihat semua data
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const survey = surveys[item.id];
                    const process = getProcessStatus(item);
                    const typeBadge = getTypeBadge(item.type);
                    const statusBadge = getStatusBadge(item.status);
                    const conditionBadge = getConditionBadge(survey?.condition);
                    const pohonInfo = getPohonInfo(item);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        
                        {/* Informasi Permohonan */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{item.nama}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${typeBadge.className}`}>
                                {typeBadge.text}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{item.perihal}</p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                {item.nomor_surat}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(item.tanggal_surat)}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-xs">{item.alamat}</span>
                              </div>
                              {item.kontak && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {item.kontak}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Status & Proses */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${statusBadge.className}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                            
                            <div className={`flex items-center gap-2 text-sm ${process.className}`}>
                              {process.icon}
                              <span>{process.text}</span>
                            </div>
                            
                            {survey && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${conditionBadge.className}`}>
                                    {conditionBadge.text}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {survey.surveyor_name}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(survey.survey_date)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Data Pohon */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {item.type === 'pemeliharaan' ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <Scissors className="h-4 w-4 text-yellow-500" />
                                  <span className="text-sm">Dipangkas: <span className="font-semibold">{pohonInfo.dipangkas}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Axe className="h-4 w-4 text-red-500" />
                                  <span className="text-sm">Ditebang: <span className="font-semibold">{pohonInfo.ditebang}</span></span>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                  <TreePine className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-semibold">Total: {pohonInfo.total}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <TreePine className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">Jumlah Pohon: <span className="font-semibold">{pohonInfo.total}</span></span>
                                </div>
                                {survey && (
                                  <div className="text-xs text-gray-500">
                                    <div>Skor: {survey.health_score}/100</div>
                                    <div>Tinggi: {survey.height || '-'}m</div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        
                        {/* Action Buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleEdit(item)}
                              className={`p-2 rounded-lg transition-colors ${
                                item.type === 'permohonan'
                                  ? 'text-purple-600 hover:bg-purple-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={item.type === 'permohonan' ? 'Survey Data' : 'Edit Data'}
                            >
                              {item.type === 'permohonan' ? (
                                <ClipboardList className="h-4 w-4" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => {
                                setItemToDelete(item);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredData.length)} dari{' '}
                  {filteredData.length} data
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded ${
                            currentPage === pageNum
                              ? 'bg-emerald-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Berikutnya
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Items per page:</span>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Detail Data Lengkap
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <Card className="p-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Informasi Dasar
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nama</label>
                        <p className="font-medium">{selectedItem.nama}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Perihal</label>
                        <p className="font-medium">{selectedItem.perihal}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nomor Surat</label>
                        <p className="font-medium">{selectedItem.nomor_surat}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Tanggal Surat</label>
                        <p className="font-medium">{formatDate(selectedItem.tanggal_surat)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Alamat</label>
                        <p className="font-medium">{selectedItem.alamat}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Koordinat</label>
                        <p className="font-medium">{selectedItem.koordinat}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Kontak</label>
                        <p className="font-medium">{selectedItem.kontak || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Tipe</label>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(selectedItem.type).className}`}>
                          {getTypeBadge(selectedItem.type).text}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedItem.status).className}`}>
                          {getStatusBadge(selectedItem.status).text}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Dibuat Pada</label>
                        <p className="font-medium">{formatDateTime(selectedItem.created_at)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Diupdate Pada</label>
                        <p className="font-medium">{formatDateTime(selectedItem.updated_at)}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Data Pohon */}
                  <Card className="p-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <TreePine className="h-5 w-5 mr-2" />
                      Data Pohon
                    </h4>
                    {selectedItem.type === 'pemeliharaan' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="text-sm text-gray-600">Pohon Dipangkas</p>
                              <p className="text-2xl font-bold text-yellow-700">{selectedItem.pemangkasan || 0}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Axe className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="text-sm text-gray-600">Pohon Ditebang</p>
                              <p className="text-2xl font-bold text-red-700">{selectedItem.penebangan || 0}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <TreePine className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">Total Pohon</p>
                              <p className="text-2xl font-bold text-green-700">
                                {(selectedItem.pemangkasan || 0) + (selectedItem.penebangan || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TreePine className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Jumlah Pohon</p>
                            <p className="text-2xl font-bold text-blue-700">{selectedItem.jumlah_pohon || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedItem.keterangan && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-500">Keterangan</label>
                        <p className="font-medium">{selectedItem.keterangan}</p>
                      </div>
                    )}
                  </Card>

                  {/* Survey Information */}
                  {selectedSurvey && (
                    <Card className="p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                        Hasil Survey Lapangan
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Tanggal Survey</label>
                          <p className="font-medium">{formatDate(selectedSurvey.survey_date)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Surveyor</label>
                          <p className="font-medium">{selectedSurvey.surveyor_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Kondisi Pohon</label>
                          <span className={`px-2 py-1 text-xs rounded-full ${getConditionBadge(selectedSurvey.condition).className}`}>
                            {getConditionBadge(selectedSurvey.condition).text}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Skor Kesehatan</label>
                          <p className="font-medium">{selectedSurvey.health_score}/100</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Tinggi (m)</label>
                          <p className="font-medium">{selectedSurvey.height || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Diameter (cm)</label>
                          <p className="font-medium">{selectedSurvey.diameter || '-'}</p>
                        </div>
                      </div>
                      
                      {selectedSurvey.recommendations && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-500">Rekomendasi</label>
                          <p className="font-medium">{selectedSurvey.recommendations}</p>
                        </div>
                      )}
                      
                      {selectedSurvey.notes && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-500">Catatan</label>
                          <p className="font-medium">{selectedSurvey.notes}</p>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Photo Gallery */}
                  {selectedPhotos.length > 0 && (
                    <Card className="p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <ImageIcon className="h-5 w-5 mr-2 text-blue-500" />
                        Dokumentasi Foto ({selectedPhotos.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedPhotos.map((photo) => (
                          <div key={photo.id} className="group relative">
                            <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                              <img
                                src={photo.url}
                                alt={photo.description || "Survey photo"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            {photo.description && (
                              <div className="mt-2 text-xs text-gray-500 truncate">
                                {photo.description}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-400">
                              {formatDate(photo.created_at)}
                            </div>
                            <a
                              href={photo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Eye className="h-6 w-6 text-white" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(selectedItem)}
                    className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      selectedItem.type === 'permohonan'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedItem.type === 'permohonan' ? (
                      <>
                        <ClipboardList className="h-4 w-4" />
                        Survey Data
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" />
                        Edit Data
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-md w-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Konfirmasi Hapus Data
                </h3>
                <p className="text-gray-600 mb-6">
                  Apakah Anda yakin ingin menghapus data dari{' '}
                  <span className="font-medium">{itemToDelete.nama}</span>?
                  {surveys[itemToDelete.id] && (
                    <span className="block text-sm text-red-500 mt-1">
                      Data survey dan foto yang terkait juga akan dihapus!
                    </span>
                  )}
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleDelete}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}