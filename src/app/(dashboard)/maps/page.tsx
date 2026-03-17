'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import MapComponent, { MapLocation as MapComponentLocation } from '@/src/components/maps/MapComponent'
import { createClient } from '@/src/lib/supabase/client'
import { 
  Loader2, 
  Filter, 
  Download, 
  Share2, 
  MapPin,
  ChevronDown,
  X,
  RefreshCw,
  FileText,
  Trees,
  Scissors,
  Axe,
  ClipboardList
} from 'lucide-react'
import { toast } from 'sonner'
import moment from 'moment'
import 'moment/locale/id'

moment.locale('id')

// Interface lokal dengan tipe yang diperluas
interface LocalMapLocation {
  lat: number
  lng: number
  name: string
  description?: string
  type: 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan' | 'survey'
  status?: 'pending' | 'completed' | 'in_progress'
  date?: string
  jumlah_pohon?: number
  source?: 'pemantauan' | 'survey'
  pemantauan_id?: string
  // Data spesifik untuk survey
  jumlah_pangkas?: number
  jumlah_tebang?: number
  catatan?: string
}

// Interface untuk MapComponent dengan tipe yang terbatas
type ComponentMapLocation = MapComponentLocation

interface FilterState {
  type: 'all' | 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan' | 'survey'
  dateRange: 'all' | 'week' | 'month' | 'year'
  status: 'all' | 'pending' | 'completed' | 'in_progress'
  source: 'all' | 'pemantauan' | 'survey'
}

// Interface untuk data dari database
interface PemantauanPohonRow {
  id: string
  nama: string
  perihal: string
  nomor_surat: string
  tanggal_surat: string
  alamat: string
  koordinat: string
  kontak: string
  type: string
  keterangan: string
  status: string
  jumlah_pohon: number
  pemangkasan: number
  penebangan: number
  user_id: string
  created_at: string
  updated_at: string
}

interface SurveyLapanganRow {
  id: string
  pemantauan_id: string
  jumlah_pangkas: number
  jumlah_tebang: number
  catatan: string
  foto_sebelum: string[]
  foto_sesudah: string[]
  created_at: string
  updated_at: string
  pemantauan_pohon?: PemantauanPohonRow
}

// Utility function untuk mendapatkan teks tipe
const getTypeText = (type: string): string => {
  switch (type) {
    case 'permohonan': return 'Permohonan'
    case 'pemeliharaan': return 'Pemeliharaan'
    case 'pemangkasan': return 'Pemangkasan'
    case 'penebangan': return 'Penebangan'
    case 'survey': return 'Survey Lapangan'
    default: return type
  }
}

// Utility function untuk mendapatkan teks status
const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Selesai'
    case 'pending': return 'Menunggu'
    case 'in_progress': return 'Dalam Proses'
    default: return status
  }
}

// Utility function untuk mendapatkan icon berdasarkan tipe
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'permohonan': return FileText
    case 'pemeliharaan': return Trees
    case 'pemangkasan': return Scissors
    case 'penebangan': return Axe
    case 'survey': return ClipboardList
    default: return MapPin
  }
}

// Fungsi untuk mengkonversi tipe lokal ke tipe komponen
const convertToComponentType = (localType: LocalMapLocation['type']): ComponentMapLocation['type'] => {
  // Jika tipe adalah 'survey', konversi ke tipe yang sesuai berdasarkan konteks
  if (localType === 'survey') {
    // Default ke pemeliharaan untuk survey umum
    return 'pemeliharaan'
  }
  return localType
}

export default function MapsPage() {
  const [localLocations, setLocalLocations] = useState<LocalMapLocation[]>([])
  const [filteredLocalLocations, setFilteredLocalLocations] = useState<LocalMapLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  
  const [filter, setFilter] = useState<FilterState>({
    type: 'all',
    dateRange: 'all',
    status: 'all',
    source: 'all'
  })

  // Computed locations untuk MapComponent dengan tipe yang sudah dikonversi
  const componentLocations = useMemo<ComponentMapLocation[]>(() => {
    return filteredLocalLocations.map(loc => ({
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      description: loc.description,
      type: convertToComponentType(loc.type),
      status: loc.status,
      date: loc.date,
      jumlah_pohon: loc.jumlah_pohon
    }))
  }, [filteredLocalLocations])

  // Utility function untuk parse coordinate
  const parseCoordinate = useCallback((coordStr: string): { lat: number; lng: number } | null => {
    try {
      // Bersihkan string koordinat dari karakter yang tidak diperlukan
      const cleanStr = coordStr.replace(/[°\s]/g, '').trim()
      
      // Memisahkan string koordinat menjadi latitude dan longitude
      const [lat, lng] = cleanStr.split(',').map(coord => parseFloat(coord.trim()))
      
      // Validasi hasil parsing
      if (isNaN(lat) || isNaN(lng)) return null
      
      // Validasi range koordinat
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
      
      return { lat, lng }
    } catch {
      return null
    }
  }, [])

  // Utility function untuk validasi type (termasuk survey)
  const isValidLocalType = useCallback((type: string): type is LocalMapLocation['type'] => {
    return ['permohonan', 'pemeliharaan', 'pemangkasan', 'penebangan', 'survey'].includes(type)
  }, [])

  // Utility function untuk validasi status
  const isValidStatus = useCallback((status: any): status is LocalMapLocation['status'] => {
    return ['pending', 'completed', 'in_progress'].includes(status)
  }, [])

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      const supabaseClient = createClient()
      
      // Fetch data dari pemantauan_pohon
      const { data: pemantauanData, error: pemantauanError } = await supabaseClient
        .from('pemantauan_pohon')
        .select('*')
        .order('created_at', { ascending: false })

      if (pemantauanError) throw pemantauanError

      // Fetch data dari survey_lapangan dengan relasi ke pemantauan_pohon
      const { data: surveyData, error: surveyError } = await supabaseClient
        .from('survey_lapangan')
        .select('*, pemantauan_pohon(*)')
        .order('created_at', { ascending: false })

      if (surveyError) throw surveyError

      const formattedLocations: LocalMapLocation[] = []

      // Process data dari pemantauan_pohon
      if (pemantauanData && pemantauanData.length > 0) {
        const pemantauanLocations = pemantauanData
          // Filter: hanya data yang memiliki koordinat
          .filter(loc => loc.koordinat && typeof loc.koordinat === 'string')
          .map(loc => {
            // Parse koordinat string menjadi {lat, lng}
            const coord = parseCoordinate(loc.koordinat)
            if (!coord) return null
            
            const type = loc.type || 'permohonan'
            const status = loc.status || 'pending'
            
            // Validasi type dan status
            if (!isValidLocalType(type) || !isValidStatus(status)) {
              return null
            }
            
            // Hitung jumlah pohon
            const jumlahPohon = loc.jumlah_pohon || loc.pemangkasan || loc.penebangan || 0
            
            // Return object dengan format LocalMapLocation
            return {
              ...coord,
              name: loc.nama || 'Lokasi Tanpa Nama',
              description: loc.keterangan || 'Tidak ada keterangan',
              type,
              status,
              date: loc.created_at,
              jumlah_pohon: jumlahPohon,
              source: 'pemantauan',
              pemantauan_id: loc.id
            } as LocalMapLocation
          })
          .filter((loc): loc is LocalMapLocation => loc !== null)

        formattedLocations.push(...pemantauanLocations)
      }

      // Process data dari survey_lapangan
      if (surveyData && surveyData.length > 0) {
        const surveyLocations = surveyData
          .filter(item => item.pemantauan_pohon) // Hanya yang memiliki relasi pemantauan
          .map(item => {
            const pemantauan = item.pemantauan_pohon as PemantauanPohonRow
            
            // Gunakan koordinat dari pemantauan_pohon
            if (!pemantauan?.koordinat) return null
            
            const coord = parseCoordinate(pemantauan.koordinat)
            if (!coord) return null
            
            // Tentukan tipe berdasarkan data survey menggunakan jumlah_pangkas dan jumlah_tebang
            let type: LocalMapLocation['type'] = 'survey'
            if (item.jumlah_pangkas > 0 && item.jumlah_tebang === 0) {
              type = 'pemangkasan'
            } else if (item.jumlah_tebang > 0 && item.jumlah_pangkas === 0) {
              type = 'penebangan'
            } else if (item.jumlah_pangkas > 0 && item.jumlah_tebang > 0) {
              type = 'pemeliharaan'
            }
            
            // Buat deskripsi detail
            let description = `Survey Lapangan - `
            if (item.jumlah_pangkas > 0) {
              description += `Pohon Dipangkas: ${item.jumlah_pangkas} `
            }
            if (item.jumlah_tebang > 0) {
              description += `Pohon Ditebang: ${item.jumlah_tebang} `
            }
            if (item.catatan) {
              description += `\nCatatan: ${item.catatan}`
            }
            
            return {
              ...coord,
              name: `${pemantauan.nama || 'Survey'} - Hasil Survey`,
              description,
              type,
              status: 'completed', // Survey selalu completed
              date: item.created_at,
              jumlah_pohon: (item.jumlah_pangkas || 0) + (item.jumlah_tebang || 0),
              jumlah_pangkas: item.jumlah_pangkas,
              jumlah_tebang: item.jumlah_tebang,
              catatan: item.catatan,
              source: 'survey',
              pemantauan_id: item.pemantauan_id
            } as LocalMapLocation
          })
          .filter((loc): loc is LocalMapLocation => loc !== null)

        formattedLocations.push(...surveyLocations)
      }

      // Urutkan berdasarkan tanggal terbaru
      formattedLocations.sort((a, b) => {
        if (!a.date || !b.date) return 0
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      console.log('Formatted locations:', formattedLocations) // Debug
      setLocalLocations(formattedLocations)
      setFilteredLocalLocations(formattedLocations)
      
    } catch (error: any) {
      console.error('Error fetching locations:', error)
      toast.error('Gagal memuat data lokasi: ' + (error?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [parseCoordinate, isValidLocalType, isValidStatus])

  const applyFilters = useCallback((locations: LocalMapLocation[], filter: FilterState) => {
    let filtered = [...locations]

    // Filter berdasarkan tipe
    if (filter.type !== 'all') {
      filtered = filtered.filter(loc => loc.type === filter.type)
    }

    // Filter berdasarkan rentang waktu
    if (filter.dateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch(filter.dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered.filter(loc => {
        if (!loc.date) return false
        const locDate = new Date(loc.date)
        return locDate >= startDate
      })
    }

    // Filter berdasarkan status
    if (filter.status !== 'all') {
      filtered = filtered.filter(loc => loc.status === filter.status)
    }

    // Filter berdasarkan sumber data
    if (filter.source !== 'all') {
      filtered = filtered.filter(loc => loc.source === filter.source)
    }

    setFilteredLocalLocations(filtered)
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  useEffect(() => {
    applyFilters(localLocations, filter)
  }, [localLocations, filter, applyFilters])

  const handleExport = useCallback(() => {
    if (filteredLocalLocations.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const csvContent = [
      ['Nama', 'Latitude', 'Longitude', 'Tipe', 'Status', 'Deskripsi', 'Tanggal', 'Jumlah Pohon', 'Jumlah Pangkas', 'Jumlah Tebang', 'Catatan', 'Sumber Data'],
      ...filteredLocalLocations.map(loc => [
        loc.name,
        loc.lat,
        loc.lng,
        getTypeText(loc.type),
        getStatusText(loc.status || 'pending'),
        loc.description || '',
        loc.date ? moment(loc.date).format('DD/MM/YYYY HH:mm') : '',
        loc.jumlah_pohon || 0,
        loc.jumlah_pangkas || 0,
        loc.jumlah_tebang || 0,
        loc.catatan || '',
        loc.source === 'pemantauan' ? 'Pemantauan' : 'Survey Lapangan'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `lokasi-pohon-${moment().format('YYYY-MM-DD-HHmm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`${filteredLocalLocations.length} data berhasil di-export ke CSV`)
  }, [filteredLocalLocations])

  const handleShare = useCallback(() => {
    const text = `Peta Kegiatan Pohon - ${filteredLocalLocations.length} lokasi ditemukan (${localLocations.filter(l => l.source === 'pemantauan').length} pemantauan, ${localLocations.filter(l => l.source === 'survey').length} survey)`
    
    if (navigator.share) {
      navigator.share({
        title: 'Peta Kegiatan Pohon',
        text: text,
        url: window.location.href,
      }).catch(() => {
        // User cancelled share
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link berhasil disalin ke clipboard')
    }
  }, [filteredLocalLocations.length, localLocations])

  const handleResetFilter = useCallback(() => {
    setFilter({ type: 'all', dateRange: 'all', status: 'all', source: 'all' })
  }, [])

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'permohonan': return 'blue'
      case 'pemeliharaan': return 'green'
      case 'pemangkasan': return 'yellow'
      case 'penebangan': return 'red'
      case 'survey': return 'purple'
      default: return 'gray'
    }
  }, [])

  const stats = useMemo(() => {
    // Hitung total pohon dari survey menggunakan jumlah_pangkas dan jumlah_tebang
    const totalPohonSurvey = localLocations
      .filter(l => l.source === 'survey')
      .reduce((acc, curr) => acc + (curr.jumlah_pohon || 0), 0)
    
    const totalPohonPemantauan = localLocations
      .filter(l => l.source === 'pemantauan')
      .reduce((acc, curr) => acc + (curr.jumlah_pohon || 0), 0)

    return {
      permohonan: localLocations.filter(l => l.type === 'permohonan').length,
      pemeliharaan: localLocations.filter(l => l.type === 'pemeliharaan').length,
      pemangkasan: localLocations.filter(l => l.type === 'pemangkasan').length,
      penebangan: localLocations.filter(l => l.type === 'penebangan').length,
      survey: localLocations.filter(l => l.type === 'survey').length,
      totalPemantauan: localLocations.filter(l => l.source === 'pemantauan').length,
      totalSurvey: localLocations.filter(l => l.source === 'survey').length,
      totalPohon: totalPohonPemantauan + totalPohonSurvey,
      totalPohonPemantauan,
      totalPohonSurvey
    }
  }, [localLocations])

  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Memuat data peta...</p>
          <p className="text-sm text-gray-500 mt-2">Mengambil data dari pemantauan dan survey</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Peta Kegiatan Pohon
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Visualisasi lokasi pemantauan dan survey lapangan
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              disabled={filteredLocalLocations.length === 0}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            
            <button
              onClick={handleShare}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 flex items-center gap-2 text-sm transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="mb-4 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm transition-colors w-full md:w-auto"
      >
        <Filter className="h-4 w-4" />
        <span>{showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ml-auto ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Tipe Kegiatan
              </label>
              <select
                value={filter.type}
                onChange={(e) => handleFilterChange('type', e.target.value as FilterState['type'])}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Kegiatan</option>
                <option value="permohonan">Permohonan</option>
                <option value="pemeliharaan">Pemeliharaan</option>
                <option value="pemangkasan">Pemangkasan</option>
                <option value="penebangan">Penebangan</option>
                <option value="survey">Survey Lapangan</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Rentang Waktu
              </label>
              <select
                value={filter.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value as FilterState['dateRange'])}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Waktu</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                value={filter.status}
                onChange={(e) => handleFilterChange('status', e.target.value as FilterState['status'])}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="in_progress">Dalam Proses</option>
                <option value="completed">Selesai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Sumber Data
              </label>
              <select
                value={filter.source}
                onChange={(e) => handleFilterChange('source', e.target.value as FilterState['source'])}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Sumber</option>
                <option value="pemantauan">Pemantauan</option>
                <option value="survey">Survey Lapangan</option>
              </select>
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={fetchLocations}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleResetFilter}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                title="Reset Filter"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-1 text-emerald-400" />
                <span>
                  Menampilkan <span className="font-semibold text-white">{filteredLocalLocations.length}</span> dari{' '}
                  <span className="font-semibold text-white">{localLocations.length}</span> lokasi
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Pemantauan: {stats.totalPemantauan}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Survey: {stats.totalSurvey}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Peta Interaktif</h3>
              <p className="text-sm text-gray-400 mt-1">
                {filteredLocalLocations.length} lokasi ditemukan 
                (Total Pohon: {stats.totalPohon} | 
                Survey: {stats.totalPohonSurvey} pohon)
              </p>
            </div>
          </div>
        </div>
        
        <div className="h-100 md:h-125 lg:h-150">
          <MapComponent 
            locations={componentLocations}
            height="100%"
            showControls={true}
            showLegend={true}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Permohonan</p>
              <p className="text-xl font-bold text-white">{stats.permohonan}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Trees className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pemeliharaan</p>
              <p className="text-xl font-bold text-white">{stats.pemeliharaan}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Scissors className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pemangkasan</p>
              <p className="text-xl font-bold text-white">{stats.pemangkasan}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Axe className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Penebangan</p>
              <p className="text-xl font-bold text-white">{stats.penebangan}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Survey</p>
              <p className="text-xl font-bold text-white">{stats.survey}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Survey Summary */}
      {stats.totalSurvey > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Ringkasan Survey Lapangan</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Total Pohon Dipangkas</p>
              <p className="text-lg font-semibold text-yellow-400">
                {localLocations.filter(l => l.source === 'survey').reduce((acc, curr) => acc + (curr.jumlah_pangkas || 0), 0)}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Total Pohon Ditebang</p>
              <p className="text-lg font-semibold text-red-400">
                {localLocations.filter(l => l.source === 'survey').reduce((acc, curr) => acc + (curr.jumlah_tebang || 0), 0)}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Rata-rata per Survey</p>
              <p className="text-lg font-semibold text-purple-400">
                {Math.round((localLocations.filter(l => l.source === 'survey').reduce((acc, curr) => acc + (curr.jumlah_pohon || 0), 0) / stats.totalSurvey) * 10) / 10} pohon
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLocalLocations.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Tidak ada lokasi ditemukan</p>
          <p className="text-sm text-gray-500 mt-1">Coba ubah filter atau refresh data</p>
          <button
            onClick={handleResetFilter}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm transition-colors"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  )
}