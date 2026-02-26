'use client'

import { useEffect, useState } from 'react'
import BarChart from '@/src/components/charts/BarChart'
import MapComponent from '@/src/components/maps/MapComponent'
import { createClient } from '@/src/lib/supabase/client'
import { toast } from 'sonner'
import { 
  FileText, 
  Trees, 
  Scissors, 
  Axe, 
  MapPin, 
  Activity, 
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Clock,
  CheckCircle,
  BarChart3,
  TreePine
} from 'lucide-react'
import Link from 'next/link'
import moment from 'moment'
import 'moment/locale/id.js'

moment.locale('id')

interface DashboardStats {
  totalPermohonan: number
  totalPemeliharaan: number
  totalPohonDipangkas: number
  totalPohonDitebang: number
  permohonanGrowth: number
  pemeliharaanGrowth: number
  pemangkasanGrowth: number
  penebanganGrowth: number
}

interface MonthlyData {
  month: string
  permohonan: number
  pemeliharaan: number
  pemangkasan: number
  penebangan: number
}

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

interface RecentActivity {
  id: string
  user_name: string
  action: string
  created_at: string
  status: 'completed' | 'pending' | 'in_progress'
  type: 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan'
  location?: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<unknown>(null)
  const [profile, setProfile] = useState<unknown>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalPermohonan: 0,
    totalPemeliharaan: 0,
    totalPohonDipangkas: 0,
    totalPohonDitebang: 0,
    permohonanGrowth: 0,
    pemeliharaanGrowth: 0,
    pemangkasanGrowth: 0,
    penebanganGrowth: 0,
  })
  const [comparisonData, setComparisonData] = useState<unknown[]>([])
  const [pohonData, setPohonData] = useState<unknown[]>([])
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [timeRange, setTimeRange] = useState('month')
  const [totalData, setTotalData] = useState(0)

  // Cek session user
  useEffect(() => {
    const supabase = createClient()
    
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        
        // Fetch profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        
        // Hitung tanggal berdasarkan timeRange
        const now = new Date()
        let startDate = new Date()
        let previousStartDate = new Date()
        
        switch(timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7)
            previousStartDate.setDate(now.getDate() - 14)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            previousStartDate.setMonth(now.getMonth() - 2)
            break
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3)
            previousStartDate.setMonth(now.getMonth() - 6)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            previousStartDate.setFullYear(now.getFullYear() - 2)
            break
          default:
            startDate = new Date(0)
            previousStartDate = new Date(0)
        }

        const startDateStr = startDate.toISOString()
        const previousStartDateStr = previousStartDate.toISOString()

        // Fetch semua data dari tabel pemantauan_pohon
        const { data: allData, error: allError } = await supabase
          .from('pemantauan_pohon')
          .select('*')

        if (allError) throw allError

        // Hitung total data
        setTotalData(allData?.length || 0)

        // Hitung statistik berdasarkan periode
        const currentData = allData?.filter(item => 
          new Date(item.created_at) >= new Date(startDateStr)
        ) || []

        const previousData = allData?.filter(item => 
          new Date(item.created_at) >= new Date(previousStartDateStr) &&
          new Date(item.created_at) < new Date(startDateStr)
        ) || []

        // Hitung total periode sekarang
        const totalPermohonan = currentData.filter(item => item.type === 'permohonan').length
        const totalPemeliharaan = currentData.filter(item => item.type === 'pemeliharaan').length
        const totalPohonDipangkas = currentData.reduce((acc, curr) => acc + (curr.pemangkasan || 0), 0)
        const totalPohonDitebang = currentData.reduce((acc, curr) => acc + (curr.penebangan || 0), 0)
        
        // Hitung total periode sebelumnya
        const prevPermohonan = previousData.filter(item => item.type === 'permohonan').length
        const prevPemeliharaan = previousData.filter(item => item.type === 'pemeliharaan').length
        const prevPemangkasan = previousData.reduce((acc, curr) => acc + (curr.pemangkasan || 0), 0)
        const prevPenebangan = previousData.reduce((acc, curr) => acc + (curr.penebangan || 0), 0)
        
        // Hitung growth secara dinamis
        const calculateGrowth = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0
          return Math.round(((current - previous) / previous) * 100)
        }

        setStats({
          totalPermohonan,
          totalPemeliharaan,
          totalPohonDipangkas,
          totalPohonDitebang,
          permohonanGrowth: calculateGrowth(totalPermohonan, prevPermohonan),
          pemeliharaanGrowth: calculateGrowth(totalPemeliharaan, prevPemeliharaan),
          pemangkasanGrowth: calculateGrowth(totalPohonDipangkas, prevPemangkasan),
          penebanganGrowth: calculateGrowth(totalPohonDitebang, prevPenebangan)
        })

        // Process monthly data untuk chart (6 bulan terakhir)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const monthlyStats: MonthlyData[] = []
        
        for (let i = 5; i >= 0; i--) {
          const month = new Date()
          month.setMonth(month.getMonth() - i)
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
          
          const monthData = allData?.filter(item => {
            const date = new Date(item.created_at)
            return date >= monthStart && date <= monthEnd
          }) || []

          monthlyStats.push({
            month: months[month.getMonth()],
            permohonan: monthData.filter(item => item.type === 'permohonan').length,
            pemeliharaan: monthData.filter(item => item.type === 'pemeliharaan').length,
            pemangkasan: monthData.reduce((acc, curr) => acc + (curr.pemangkasan || 0), 0),
            penebangan: monthData.reduce((acc, curr) => acc + (curr.penebangan || 0), 0)
          })
        }

        setComparisonData(monthlyStats.map(item => ({
          name: item.month,
          permohonan: item.permohonan,
          pemeliharaan: item.pemeliharaan
        })))

        // Data untuk grafik pohon
        setPohonData(monthlyStats.map(item => ({
          name: item.month,
          dipangkas: item.pemangkasan,
          ditebang: item.penebangan
        })))

        // Process map locations
        const locations = allData
          ?.filter(item => item.koordinat && typeof item.koordinat === 'string')
          .map(item => {
            try {
              const [lat, lng] = item.koordinat.split(',').map((coord: string) => parseFloat(coord.trim()))
              if (isNaN(lat) || isNaN(lng)) return null
              
              return {
                lat,
                lng,
                name: item.nama || 'Lokasi Tanpa Nama',
                description: item.keterangan || 'Tidak ada keterangan',
                type: item.type as 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan',
                status: item.status as 'pending' | 'completed' | 'in_progress',
                date: item.created_at,
                jumlah_pohon: item.jumlah_pohon || 0
              }
            } catch {
              return null
            }
          })
          .filter((loc): loc is MapLocation => loc !== null)
          .slice(0, 50) // Batasi 50 lokasi untuk performa

        setMapLocations(locations || [])

        // Process recent activities
        const activities = allData
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            user_name: 'Pengguna',
            action: `${item.type === 'permohonan' ? 'Permohonan' : 
                     item.type === 'pemeliharaan' ? 'Pemeliharaan' : 
                     item.type === 'pemangkasan' ? 'Pemangkasan' : 'Penebangan'} - ${item.perihal || item.nama}`,
            created_at: item.created_at,
            status: item.status as 'completed' | 'pending' | 'in_progress',
            type: item.type as 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan',
            location: item.alamat
          })) || []

        setRecentActivities(activities)

      } catch (error: any) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Gagal memuat data dashboard: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [timeRange, user])

  const fetchDashboardData = async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      
      // Hitung tanggal berdasarkan timeRange
      const now = new Date()
      let startDate = new Date()
      let previousStartDate = new Date()
      
      switch(timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          previousStartDate.setDate(now.getDate() - 14)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          previousStartDate.setMonth(now.getMonth() - 2)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          previousStartDate.setMonth(now.getMonth() - 6)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          previousStartDate.setFullYear(now.getFullYear() - 2)
          break
        default:
          startDate = new Date(0)
          previousStartDate = new Date(0)
      }

      const startDateStr = startDate.toISOString()
      const previousStartDateStr = previousStartDate.toISOString()

      // Fetch semua data dari tabel pemantauan_pohon
      const { data: allData, error: allError } = await supabase
        .from('pemantauan_pohon')
        .select('*')

      if (allError) throw allError

      // Hitung total data
      setTotalData(allData?.length || 0)

      // Hitung statistik berdasarkan periode
      const currentData = allData?.filter(item => 
        new Date(item.created_at) >= new Date(startDateStr)
      ) || []

      const previousData = allData?.filter(item => 
        new Date(item.created_at) >= new Date(previousStartDateStr) &&
        new Date(item.created_at) < new Date(startDateStr)
      ) || []

      // Hitung total periode sekarang
      const totalPermohonan = currentData.filter(item => item.type === 'permohonan').length
      const totalPemeliharaan = currentData.filter(item => item.type === 'pemeliharaan').length
      const totalPohonDipangkas = currentData.reduce((acc, curr) => acc + (curr.pemangkasan || 0), 0)
      const totalPohonDitebang = currentData.reduce((acc, curr) => acc + (curr.penebangan || 0), 0)
      
      // Hitung total periode sebelumnya
      const prevPermohonan = previousData.filter(item => item.type === 'permohonan').length
      const prevPemeliharaan = previousData.filter(item => item.type === 'pemeliharaan').length
      const prevPemangkasan = previousData.reduce((acc, curr) => acc + (curr.pemangkasan || 0), 0)
      const prevPenebangan = previousData.reduce((acc, curr) => acc + (curr.penebangan || 0), 0)
      
      // Hitung growth secara dinamis
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      setStats({
        totalPermohonan,
        totalPemeliharaan,
        totalPohonDipangkas,
        totalPohonDitebang,
        permohonanGrowth: calculateGrowth(totalPermohonan, prevPermohonan),
        pemeliharaanGrowth: calculateGrowth(totalPemeliharaan, prevPemeliharaan),
        pemangkasanGrowth: calculateGrowth(totalPohonDipangkas, prevPemangkasan),
        penebanganGrowth: calculateGrowth(totalPohonDitebang, prevPenebangan)
      })

      // Process monthly data untuk chart (6 bulan terakhir)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const monthlyStats: MonthlyData[] = []
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date()
        month.setMonth(month.getMonth() - i)
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        
        const monthData = allData?.filter(item => {
          const date = new Date(item.created_at)
          return date >= monthStart && date <= monthEnd
        }) || []

        monthlyStats.push({
          month: months[month.getMonth()],
          permohonan: monthData.filter(item => item.type === 'permohonan').length,
          pemeliharaan: monthData.filter(item => item.type === 'pemeliharaan').length,
          pemangkasan: monthData.reduce((acc, curr) => acc + (curr.pemangkasan || 0), 0),
          penebangan: monthData.reduce((acc, curr) => acc + (curr.penebangan || 0), 0)
        })
      }

      setMonthlyData(monthlyStats)

      // Data untuk grafik perbandingan
      setComparisonData(monthlyStats.map(item => ({
        name: item.month,
        permohonan: item.permohonan,
        pemeliharaan: item.pemeliharaan
      })))

      // Data untuk grafik pohon
      setPohonData(monthlyStats.map(item => ({
        name: item.month,
        dipangkas: item.pemangkasan,
        ditebang: item.penebangan
      })))

      // Process map locations
      const locations = allData
        ?.filter(item => item.koordinat && typeof item.koordinat === 'string')
        .map(item => {
          try {
            const [lat, lng] = item.koordinat.split(',').map(coord => parseFloat(coord.trim()))
            if (isNaN(lat) || isNaN(lng)) return null
            
            return {
              lat,
              lng,
              name: item.nama || 'Lokasi Tanpa Nama',
              description: item.keterangan || 'Tidak ada keterangan',
              type: item.type as 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan',
              status: item.status as 'pending' | 'completed' | 'in_progress',
              date: item.created_at,
              jumlah_pohon: item.jumlah_pohon || 0
            }
          } catch {
            return null
          }
        })
        .filter((loc): loc is MapLocation => loc !== null)
        .slice(0, 50) // Batasi 50 lokasi untuk performa

      setMapLocations(locations || [])

      // Process recent activities
      const activities = allData
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          user_name: 'Pengguna',
          action: `${item.type === 'permohonan' ? 'Permohonan' : 
                   item.type === 'pemeliharaan' ? 'Pemeliharaan' : 
                   item.type === 'pemangkasan' ? 'Pemangkasan' : 'Penebangan'} - ${item.perihal || item.nama}`,
          created_at: item.created_at,
          status: item.status as 'completed' | 'pending' | 'in_progress',
          type: item.type as 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan',
          location: item.alamat
        })) || []

      setRecentActivities(activities)

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Selesai', icon: CheckCircle },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Menunggu', icon: Clock },
      in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Dalam Proses', icon: Activity }
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      permohonan: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Permohonan', icon: FileText },
      pemeliharaan: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Pemeliharaan', icon: Trees },
      pemangkasan: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pemangkasan', icon: Scissors },
      penebangan: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Penebangan', icon: Axe }
    }
    return badges[type as keyof typeof badges] || badges.permohonan
  }

  const formatTimeAgo = (dateString: string) => {
    return moment(dateString).fromNow()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const statsCards = [
    { 
      name: 'Permohonan', 
      value: formatNumber(stats.totalPermohonan), 
      change: stats.permohonanGrowth,
      icon: FileText,
      color: 'blue',
      bgGradient: 'from-blue-600/20 to-blue-600/5'
    },
    { 
      name: 'Pemeliharaan', 
      value: formatNumber(stats.totalPemeliharaan), 
      change: stats.pemeliharaanGrowth,
      icon: Trees,
      color: 'green',
      bgGradient: 'from-green-600/20 to-green-600/5'
    },
    { 
      name: 'Pohon Dipangkas', 
      value: formatNumber(stats.totalPohonDipangkas), 
      change: stats.pemangkasanGrowth,
      icon: Scissors,
      color: 'yellow',
      bgGradient: 'from-yellow-600/20 to-yellow-600/5'
    },
    { 
      name: 'Pohon Ditebang', 
      value: formatNumber(stats.totalPohonDitebang), 
      change: stats.penebanganGrowth,
      icon: Axe,
      color: 'red',
      bgGradient: 'from-red-600/20 to-red-600/5'
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-800 rounded-xl"></div>
            <div className="h-96 bg-gray-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Dashboard Pemantauan Pohon
            </h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {moment().format('dddd, DD MMMM YYYY')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              >
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
                <option value="year">Tahun Ini</option>
                <option value="all">Semua Waktu</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            
            <button 
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Welcome Message */}
        {user && (
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
            <p className="text-gray-300">
              Selamat datang kembali,{' '}
              <span className="font-semibold text-emerald-400">
                {profile?.full_name || user.email?.split('@')[0]}
              </span>
              <span className="text-gray-500 ml-2">
                • Total Data: {formatNumber(totalData)} records
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 hover:border-gray-600 transition-all cursor-pointer"
              onClick={() => setSelectedStat(stat.name)}
              onMouseLeave={() => setSelectedStat(null)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-500/20`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    <span className="text-xs font-medium">{Math.abs(stat.change)}%</span>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        {/* Peta Interaktif */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
                Peta Lokasi
              </h3>
              <p className="text-sm text-gray-400 mt-1">{mapLocations.length} lokasi aktif</p>
            </div>
          </div>
          <div className="h-[300px] rounded-xl overflow-hidden">
            <MapComponent 
              locations={mapLocations}
              height="100%"
              showControls={true}
              showLegend={true}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-300">Permohonan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">Pemeliharaan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-300">Pemangkasan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-300">Penebangan</span>
            </div>
          </div>
        </div>

        {/* Grafik Perbandingan */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Perbandingan Permohonan vs Pemeliharaan
              </h3>
              <p className="text-sm text-gray-400 mt-1">Data 6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-[300px]">
            <BarChart 
              data={comparisonData} 
              dataKey={["permohonan", "pemeliharaan"]}
              height={300} 
              barColors={['#3b82f6', '#10b981']}
              showLegend={true}
              legendLabels={['Permohonan', 'Pemeliharaan']}
            />
          </div>
        </div>

        {/* Grafik Pohon */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TreePine className="h-5 w-5 text-emerald-400" />
                Pohon Dipangkas vs Ditebang
              </h3>
              <p className="text-sm text-gray-400 mt-1">Data 6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-[300px]">
            <BarChart 
              data={pohonData} 
              dataKey={["dipangkas", "ditebang"]}
              height={300} 
              barColors={['#f59e0b', '#ef4444']}
              showLegend={true}
              legendLabels={['Dipangkas', 'Ditebang']}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Aktivitas Terbaru
              </h3>
              <p className="text-sm text-gray-400 mt-1">5 aktivitas terakhir</p>
            </div>
            <Link 
              href="/laporan"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
        
        {recentActivities.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {recentActivities.map((activity) => {
              const status = getStatusBadge(activity.status)
              const type = getTypeBadge(activity.type)
              const StatusIcon = status.icon
              
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${type.bg}`}>
                      <type.icon className={`h-5 w-5 ${type.text}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{activity.user_name}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${type.bg} ${type.text}`}>
                          {type.label}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm truncate">{activity.action}</p>
                      {activity.location && (
                        <p className="text-xs text-gray-500 mt-1">{activity.location}</p>
                      )}
                    </div>
                    
                    {/* Status & Time */}
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${status.bg}`}>
                        <StatusIcon className={`h-3 w-3 ${status.text}`} />
                        <span className={`text-xs ${status.text}`}>{status.label}</span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Tidak ada aktivitas terbaru</p>
          </div>
        )}
      </div>
    </div>
  )
}