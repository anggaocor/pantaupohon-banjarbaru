'use client'

import { useState, useEffect } from 'react'
import MapComponent from '@/src/components/maps/MapComponent'
import { createClient } from '@/src/lib/supabase/client'
import { 
  Loader2, 
  Filter, 
  Download, 
  Share2, 
  Calendar, 
  MapPin,
  ChevronDown,
  X,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import moment from 'moment'
import 'moment/locale/id'

moment.locale('id')

interface MapLocation {
  lat: number
  lng: number
  name: string
  description?: string
  type: 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan'
  status?: 'pending' | 'completed' | 'in_progress'
  date?: string
  jumlah_pohon?: number
}

export default function MapsPage() {
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [filteredLocations, setFilteredLocations] = useState<MapLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  
  const [filter, setFilter] = useState({
    type: 'all' as 'all' | 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan',
    dateRange: 'all' as 'all' | 'week' | 'month' | 'year',
    status: 'all' as 'all' | 'pending' | 'completed' | 'in_progress'
  })

  const supabase = createClient()

  const fetchLocations = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('pemantauan_pohon')
        .select('nama, keterangan, koordinat, type, status, created_at, pemangkasan, penebangan, jumlah_pohon')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const formattedLocations = data
          .filter(loc => loc.koordinat && typeof loc.koordinat === 'string')
          .map(loc => {
            try {
              const [lat, lng] = loc.koordinat.split(',').map(coord => parseFloat(coord.trim()))
              if (isNaN(lat) || isNaN(lng)) return null
              
              return {
                lat,
                lng,
                name: loc.nama || 'Lokasi Tanpa Nama',
                description: loc.keterangan || 'Tidak ada keterangan',
                type: (loc.type || 'permohonan') as 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan',
                status: (loc.status || 'pending') as 'pending' | 'completed' | 'in_progress',
                date: loc.created_at,
                jumlah_pohon: loc.pemangkasan || loc.penebangan || loc.jumlah_pohon || 0
              }
            } catch {
              return null
            }
          })
          .filter((loc): loc is MapLocation => loc !== null)

        setLocations(formattedLocations)
        applyFilters(formattedLocations, filter)
      } else {
        setLocations([])
        setFilteredLocations([])
      }
    } catch (error: any) {
      console.error('Error fetching locations:', error)
      toast.error('Gagal memuat data lokasi')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (locations: MapLocation[], filter: any) => {
    let filtered = [...locations]

    if (filter.type !== 'all') {
      filtered = filtered.filter(loc => loc.type === filter.type)
    }

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

    if (filter.status !== 'all') {
      filtered = filtered.filter(loc => loc.status === filter.status)
    }

    setFilteredLocations(filtered)
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    applyFilters(locations, filter)
  }, [filter, locations])

  const handleExport = () => {
    if (filteredLocations.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const csvContent = [
      ['Nama', 'Latitude', 'Longitude', 'Tipe', 'Status', 'Deskripsi', 'Tanggal', 'Jumlah Pohon'],
      ...filteredLocations.map(loc => [
        loc.name,
        loc.lat,
        loc.lng,
        getTypeText(loc.type),
        getStatusText(loc.status || 'pending'),
        loc.description || '',
        loc.date ? moment(loc.date).format('DD/MM/YYYY') : '',
        loc.jumlah_pohon || 0
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `lokasi-pohon-${moment().format('YYYY-MM-DD')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`${filteredLocations.length} data berhasil di-export ke CSV`)
  }

  const handleShare = () => {
    const text = `Peta Kegiatan Pohon - ${filteredLocations.length} lokasi ditemukan`
    
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
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'permohonan': return 'Permohonan'
      case 'pemeliharaan': return 'Pemeliharaan'
      case 'pemangkasan': return 'Pemangkasan'
      case 'penebangan': return 'Penebangan'
      default: return type
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai'
      case 'pending': return 'Menunggu'
      case 'in_progress': return 'Dalam Proses'
      default: return status
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'permohonan': return 'bg-blue-500'
      case 'pemeliharaan': return 'bg-green-500'
      case 'pemangkasan': return 'bg-yellow-500'
      case 'penebangan': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'in_progress': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeStats = () => {
    return {
      permohonan: locations.filter(l => l.type === 'permohonan').length,
      pemeliharaan: locations.filter(l => l.type === 'pemeliharaan').length,
      pemangkasan: locations.filter(l => l.type === 'pemangkasan').length,
      penebangan: locations.filter(l => l.type === 'penebangan').length,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Memuat data peta...</p>
        </div>
      </div>
    )
  }

  const stats = getTypeStats()

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
              Visualisasi lokasi permohonan, pemeliharaan, pemangkasan, dan penebangan pohon
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              disabled={filteredLocations.length === 0}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Tipe Kegiatan
              </label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({...filter, type: e.target.value as any})}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Kegiatan</option>
                <option value="permohonan">Permohonan</option>
                <option value="pemeliharaan">Pemeliharaan</option>
                <option value="pemangkasan">Pemangkasan</option>
                <option value="penebangan">Penebangan</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Rentang Waktu
              </label>
              <select
                value={filter.dateRange}
                onChange={(e) => setFilter({...filter, dateRange: e.target.value as any})}
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
                onChange={(e) => setFilter({...filter, status: e.target.value as any})}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="in_progress">Dalam Proses</option>
                <option value="completed">Selesai</option>
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
                onClick={() => setFilter({ type: 'all', dateRange: 'all', status: 'all' })}
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
                  Menampilkan <span className="font-semibold text-white">{filteredLocations.length}</span> dari{' '}
                  <span className="font-semibold text-white">{locations.length}</span> lokasi
                </span>
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
                {filteredLocations.length} lokasi ditemukan
              </p>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] md:h-[500px] lg:h-[600px]">
          <MapComponent 
            locations={filteredLocations}
            height="100%"
            showControls={true}
            showLegend={true}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-400" />
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
              <MapPin className="h-5 w-5 text-green-400" />
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
              <MapPin className="h-5 w-5 text-yellow-400" />
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
              <MapPin className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Penebangan</p>
              <p className="text-xl font-bold text-white">{stats.penebangan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredLocations.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Tidak ada lokasi ditemukan</p>
          <button
            onClick={() => setFilter({ type: 'all', dateRange: 'all', status: 'all' })}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm transition-colors"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  )
}