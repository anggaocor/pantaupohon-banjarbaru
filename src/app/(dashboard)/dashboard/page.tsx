'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import moment from 'moment'
import 'moment/locale/id'

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
  TreePine,
  User,
  AlertCircle
} from 'lucide-react'

/* ===========================
   DYNAMIC IMPORT (WAJIB SSR FALSE)
=========================== */

const MapComponent = dynamic(
  () => import('@/src/components/maps/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl">
        <div className="animate-pulse text-gray-400">Memuat peta...</div>
      </div>
    )
  }
)

const BarChart = dynamic(
  () => import('@/src/components/charts/BarChart'),
  { ssr: false }
)

const LineChart = dynamic(
  () => import('@/src/components/charts/LineChart'),
  { ssr: false }
)

interface DashboardStats {
  totalPermohonan: number
  totalPemeliharaan: number
  totalPohonDipangkas: number
  totalPohonDitebang: number
  totalSurvey: number
  permohonanGrowth: number
  pemeliharaanGrowth: number
  pemangkasanGrowth: number
  penebanganGrowth: number
  surveyGrowth: number
}

interface MonthlyData {
  month: string
  monthFull: string
  permohonan: number
  pemeliharaan: number
  pemangkasan: number
  penebangan: number
  survey: number
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
  user_id: string
  user_name: string
  user_email?: string
  action: string
  tanggal_surat?: string
  survey_date?: string
  created_at?: string
  status: 'completed' | 'pending' | 'in_progress'
  type: 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan' | 'survey'
  location?: string
  jumlah_pangkas?: number
  jumlah_tebang?: number
}

interface User {
  email?: string
  id?: string
}

interface Profile {
  full_name?: string
  email?: string
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

// Interface untuk data survey lapangan
interface SurveyLapanganRow {
  id: string
  pemantauan_id: string
  jumlah_pangkas: number
  jumlah_tebang: number
  survey_date: string
  catatan?: string
  created_at: string
  pemantauan_pohon?: {
    id: string
    type: string
    nama: string
    alamat: string
    user_id: string
    tanggal_surat: string
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalPermohonan: 0,
    totalPemeliharaan: 0,
    totalPohonDipangkas: 0,
    totalPohonDitebang: 0,
    totalSurvey: 0,
    permohonanGrowth: 0,
    pemeliharaanGrowth: 0,
    pemangkasanGrowth: 0,
    penebanganGrowth: 0,
    surveyGrowth: 0,
  })
  const [comparisonData, setComparisonData] = useState<Array<{name: string, permohonan: number, pemeliharaan: number}>>([])
  const [pohonData, setPohonData] = useState<Array<{name: string, dipangkas: number, ditebang: number}>>([])
  const [surveyTrendData, setSurveyTrendData] = useState<Array<{name: string, survey: number}>>([])
  const [locations, setMapLocations] = useState<MapLocation[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [timeRange, setTimeRange] = useState('month')
  const [totalData, setTotalData] = useState({ pemantauan: 0, survey: 0 })
  const [selectedStat, setSelectedStat] = useState<string | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

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

  // Fetch dashboard data
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
          .order('tanggal_surat', { ascending: false })

        if (allError) throw allError

        // Fetch semua data dari tabel survey_lapangan
        const { data: surveyData, error: surveyError } = await supabase
          .from('survey_lapangan')
          .select('*, pemantauan_pohon(*)')
          .order('survey_date', { ascending: false })

        if (surveyError) throw surveyError

        // Hitung total data
        setTotalData({
          pemantauan: allData?.length || 0,
          survey: surveyData?.length || 0
        })

        // Hitung statistik berdasarkan periode dari pemantauan_pohon (menggunakan tanggal_surat)
        const currentData = allData?.filter(item => 
          new Date(item.tanggal_surat) >= new Date(startDateStr)
        ) || []

        const previousData = allData?.filter(item => 
          new Date(item.tanggal_surat) >= new Date(previousStartDateStr) &&
          new Date(item.tanggal_surat) < new Date(startDateStr)
        ) || []

        // Filter survey data berdasarkan periode (menggunakan survey_date)
        const currentSurveyData = surveyData?.filter(item => 
          new Date(item.survey_date) >= new Date(startDateStr)
        ) || []

        const previousSurveyData = surveyData?.filter(item => 
          new Date(item.survey_date) >= new Date(previousStartDateStr) &&
          new Date(item.survey_date) < new Date(startDateStr)
        ) || []

        // Hitung total periode sekarang
        const totalPermohonan = currentData.filter(item => item.type === 'permohonan').length
        const totalPemeliharaan = currentData.filter(item => item.type === 'pemeliharaan').length
        const totalSurvey = currentSurveyData.length
        
        // Hitung total pohon dari survey_lapangan
        const totalPohonDipangkas = currentSurveyData.reduce((acc, curr) => acc + (curr.jumlah_pangkas || 0), 0)
        const totalPohonDitebang = currentSurveyData.reduce((acc, curr) => acc + (curr.jumlah_tebang || 0), 0)
        
        // Hitung total periode sebelumnya
        const prevPermohonan = previousData.filter(item => item.type === 'permohonan').length
        const prevPemeliharaan = previousData.filter(item => item.type === 'pemeliharaan').length
        const prevSurvey = previousSurveyData.length
        const prevPemangkasan = previousSurveyData.reduce((acc, curr) => acc + (curr.jumlah_pangkas || 0), 0)
        const prevPenebangan = previousSurveyData.reduce((acc, curr) => acc + (curr.jumlah_tebang || 0), 0)
        
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
          totalSurvey,
          permohonanGrowth: calculateGrowth(totalPermohonan, prevPermohonan),
          pemeliharaanGrowth: calculateGrowth(totalPemeliharaan, prevPemeliharaan),
          pemangkasanGrowth: calculateGrowth(totalPohonDipangkas, prevPemangkasan),
          penebanganGrowth: calculateGrowth(totalPohonDitebang, prevPenebangan),
          surveyGrowth: calculateGrowth(totalSurvey, prevSurvey)
        })

        // Process monthly data untuk chart (6 bulan terakhir)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const monthlyStats: MonthlyData[] = []
        
        for (let i = 5; i >= 0; i--) {
          const month = new Date()
          month.setMonth(month.getMonth() - i)
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
          
          // Data dari pemantauan_pohon berdasarkan tanggal_surat
          const monthData = allData?.filter(item => {
            const date = new Date(item.tanggal_surat)
            return date >= monthStart && date <= monthEnd
          }) || []

          // Data dari survey_lapangan berdasarkan survey_date
          const monthSurveyData = surveyData?.filter(item => {
            const date = new Date(item.survey_date)
            return date >= monthStart && date <= monthEnd
          }) || []

          monthlyStats.push({
            month: months[month.getMonth()],
            monthFull: month.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
            permohonan: monthData.filter(item => item.type === 'permohonan').length,
            pemeliharaan: monthData.filter(item => item.type === 'pemeliharaan').length,
            pemangkasan: monthSurveyData.reduce((acc, curr) => acc + (curr.jumlah_pangkas || 0), 0),
            penebangan: monthSurveyData.reduce((acc, curr) => acc + (curr.jumlah_tebang || 0), 0),
            survey: monthSurveyData.length
          })
        }

        setMonthlyData(monthlyStats)

        // Data untuk grafik perbandingan permohonan vs pemeliharaan
        setComparisonData(monthlyStats.map(item => ({
          name: item.month,
          permohonan: item.permohonan,
          pemeliharaan: item.pemeliharaan
        })))

        // Data untuk grafik pohon (pangkas vs tebang)
        setPohonData(monthlyStats.map(item => ({
          name: item.month,
          dipangkas: item.pemangkasan,
          ditebang: item.penebangan
        })))

        // Data untuk grafik trend survey
        setSurveyTrendData(monthlyStats.map(item => ({
          name: item.month,
          survey: item.survey
        })))

        // Utility function untuk validasi coordinate
        const parseCoordinate = (coordStr: string): { lat: number; lng: number } | null => {
          try {
            // Bersihkan string koordinat
            const cleanStr = coordStr.replace(/[°\s]/g, '').trim()
            const [lat, lng] = cleanStr.split(',').map(coord => {
              const parsed = parseFloat(coord.trim())
              return isNaN(parsed) ? null : parsed
            })
            
            if (lat === null || lng === null) return null
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
            
            return { lat, lng }
          } catch {
            return null
          }
        }

        // Utility function untuk validasi type
        const isValidType = (type: string): type is MapLocation['type'] => {
          return ['permohonan', 'pemeliharaan', 'pemangkasan', 'penebangan'].includes(type)
        }
          
        // Utility function untuk validasi status
        const isValidStatus = (status: any): status is MapLocation['status'] => {
          return ['pending', 'completed', 'in_progress'].includes(status)
        }

        // Process map locations dari pemantauan_pohon
        const locations = allData
          ?.filter(item => item.koordinat && typeof item.koordinat === 'string')
          .map(item => {
            const coord = parseCoordinate(item.koordinat)
            if (!coord) return null
            
            const type = item.type as string
            const status = item.status as string
            
            if (!isValidType(type) || !isValidStatus(status)) {
              return null
            }
            
            return {
              lat: coord.lat,
              lng: coord.lng,
              name: item.nama || 'Lokasi Tanpa Nama',
              description: item.keterangan || 'Tidak ada keterangan',
              type,
              status,
              date: item.tanggal_surat,
              jumlah_pohon: item.jumlah_pohon || 0
            } as MapLocation
          })
          .filter((loc): loc is MapLocation => loc !== null)
          .slice(0, 50)

        setMapLocations(locations || [])

        // Dapatkan semua user_id yang unik
        const userIds = [...new Set(allData?.map(item => item.user_id) || [])]
        
        // Fetch profiles untuk user_id tersebut
        let profilesMap: Record<string, any> = {}
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds)

          if (profilesData) {
            profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile
              return acc
            }, {} as Record<string, any>)
          }
        }

        // Process recent activities dari kedua tabel
        const activities: RecentActivity[] = []

        // Tambahkan aktivitas dari pemantauan_pohon
        allData?.slice(0, 3).forEach(item => {
          const userProfile = profilesMap[item.user_id]
          const userName = userProfile?.full_name || 
                          userProfile?.email?.split('@')[0] || 
                          'Pengguna'
          
          activities.push({
            id: `pohon-${item.id}`,
            user_id: item.user_id,
            user_name: userName,
            user_email: userProfile?.email,
            action: `${item.type === 'permohonan' ? 'Permohonan' : 'Pemeliharaan'} - ${item.perihal || item.nama || ''}`,
            tanggal_surat: item.tanggal_surat,
            status: item.status as 'completed' | 'pending' | 'in_progress',
            type: item.type as 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan',
            location: item.alamat
          })
        })

        // Tambahkan aktivitas dari survey_lapangan
        surveyData?.slice(0, 3).forEach(item => {
          const pemantauan = item.pemantauan_pohon
          if (pemantauan) {
            const userProfile = profilesMap[pemantauan.user_id]
            const userName = userProfile?.full_name || 
                            userProfile?.email?.split('@')[0] || 
                            'Pengguna'
            
            // Tentukan aksi berdasarkan jumlah pohon
            let action = 'Survey Lapangan'
            if (item.jumlah_pangkas > 0 && item.jumlah_tebang > 0) {
              action += ` - ${item.jumlah_pangkas} pangkas, ${item.jumlah_tebang} tebang`
            } else if (item.jumlah_pangkas > 0) {
              action += ` - ${item.jumlah_pangkas} pohon dipangkas`
            } else if (item.jumlah_tebang > 0) {
              action += ` - ${item.jumlah_tebang} pohon ditebang`
            }

            activities.push({
              id: `survey-${item.id}`,
              user_id: pemantauan.user_id,
              user_name: userName,
              user_email: userProfile?.email,
              action,
              survey_date: item.survey_date,
              status: 'completed',
              type: 'survey',
              location: pemantauan.alamat,
              jumlah_pangkas: item.jumlah_pangkas,
              jumlah_tebang: item.jumlah_tebang
            })
          }
        })

        // Urutkan berdasarkan tanggal terbaru (gabungan tanggal_surat dan survey_date)
        const sortedActivities = activities
          .sort((a, b) => {
            const dateA = new Date(a.tanggal_surat || a.survey_date || '').getTime()
            const dateB = new Date(b.tanggal_surat || b.survey_date || '').getTime()
            return dateB - dateA
          })
          .slice(0, 5)

        setRecentActivities(sortedActivities)

      } catch (error: any) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Gagal memuat data dashboard: ' + (error?.message || 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [timeRange, user])

  const handleRefresh = async () => {
    if (!user) return
    
    const supabase = createClient()
    try {
      setLoading(true)
      
      // Refresh logic sama seperti di atas
      // ... (sama dengan fetchDashboardData)

      toast.success('Data berhasil diperbarui')
    } catch (error: any) {
      console.error('Error refreshing dashboard data:', error)
      toast.error('Gagal memperbarui data: ' + (error?.message || 'Unknown error'))
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
      penebangan: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Penebangan', icon: Axe },
      survey: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Survey', icon: Activity }
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
      bgGradient: 'from-blue-600/20 to-blue-600/5',
      description: 'Berdasarkan tanggal_surat'
    },
    { 
      name: 'Pemeliharaan', 
      value: formatNumber(stats.totalPemeliharaan), 
      change: stats.pemeliharaanGrowth,
      icon: Trees,
      color: 'green',
      bgGradient: 'from-green-600/20 to-green-600/5',
      description: 'Berdasarkan tanggal_surat'
    },
    { 
      name: 'Survey Lapangan', 
      value: formatNumber(stats.totalSurvey), 
      change: stats.surveyGrowth,
      icon: Activity,
      color: 'purple',
      bgGradient: 'from-purple-600/20 to-purple-600/5',
      description: 'Berdasarkan survey_date'
    },
    { 
      name: 'Pohon Dipangkas', 
      value: formatNumber(stats.totalPohonDipangkas), 
      change: stats.pemangkasanGrowth,
      icon: Scissors,
      color: 'yellow',
      bgGradient: 'from-yellow-600/20 to-yellow-600/5',
      description: 'Dari data survey'
    },
    { 
      name: 'Pohon Ditebang', 
      value: formatNumber(stats.totalPohonDitebang), 
      change: stats.penebanganGrowth,
      icon: Axe,
      color: 'red',
      bgGradient: 'from-red-600/20 to-red-600/5',
      description: 'Dari data survey'
    },
  ]

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) {
      try {
        return user.email.split('@')[0] || 'User';
      } catch {
        return 'User';
      }
    }
    return 'User';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-800 rounded-xl"></div>
            <div className="h-96 bg-gray-800 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-800 rounded-xl"></div>
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
            <h1 className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
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
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Welcome Message */}
        {user && (
          <div className="mt-4 p-4 bg-linear-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
            <p className="text-gray-300">
              Selamat datang kembali,{' '}
              <span className="font-semibold text-emerald-400">
                {getUserDisplayName()}
              </span>
            </p>
            <div className="flex gap-4 mt-2 text-sm text-gray-400">
              <span>📋 Pemantauan: {formatNumber(totalData.pemantauan)} data</span>
              <span>🔍 Survey: {formatNumber(totalData.survey)} data</span>
              <span>📊 Total Pohon: {formatNumber(stats.totalPohonDipangkas + stats.totalPohonDitebang)} pohon</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
              <div className={`absolute inset-0 bg-linear-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
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
                
                <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                  {stat.name}
                  <span className="text-xs text-gray-500" title={stat.description}>
                    <AlertCircle className="h-3 w-3" />
                  </span>
                </p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grafik Perbandingan Permohonan vs Pemeliharaan */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Permohonan vs Pemeliharaan
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Berdasarkan tanggal_surat • 6 bulan terakhir
              </p>
            </div>
          </div>
          <div className="h-80">
            <BarChart 
              data={comparisonData} 
              dataKey={["permohonan", "pemeliharaan"]}
              height={320} 
              barColors={['#3b82f6', '#10b981']}
              showLegend={true}
              legendLabels={['Permohonan', 'Pemeliharaan']}
            />
          </div>
        </div>

        {/* Grafik Trend Survey */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Trend Survey Lapangan
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Berdasarkan survey_date • 6 bulan terakhir
              </p>
            </div>
          </div>
          <div className="h-80">
            <LineChart 
              data={surveyTrendData}
              dataKey="survey"
              height={320}
              lineColor="#a78bfa"
              showLegend={false}
            />
          </div>
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grafik Pohon Dipangkas vs Ditebang */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TreePine className="h-5 w-5 text-emerald-400" />
                Pohon Dipangkas vs Ditebang
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Dari data survey • 6 bulan terakhir
              </p>
            </div>
          </div>
          <div className="h-80">
            <BarChart 
              data={pohonData} 
              dataKey={["dipangkas", "ditebang"]}
              height={320} 
              barColors={['#f59e0b', '#ef4444']}
              showLegend={true}
              legendLabels={['Dipangkas', 'Ditebang']}
            />
          </div>
        </div>

        {/* Peta Lokasi */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
                Peta Lokasi Pemantauan
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {locations.length} lokasi dengan koordinat
              </p>
            </div>
          </div>
          <div className="h-80 rounded-xl overflow-hidden bg-gray-900">
            {locations.length > 0 ? (
              <MapComponent 
                locations={locations}
                height="100%"
                showControls={true}
                showLegend={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                  <p>Tidak ada lokasi dengan koordinat valid</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-300">Permohonan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-300">Pemeliharaan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-300">Sudah Survey</span>
            </div>
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
              <p className="text-sm text-gray-400 mt-1">
                Berdasarkan tanggal_surat (pemantauan) dan survey_date (survey)
              </p>
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
              const activityDate = activity.tanggal_surat || activity.survey_date || ''
              
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${type.bg} shrink-0`}>
                      <type.icon className={`h-5 w-5 ${type.text}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-white flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-400" />
                          {activity.user_name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${type.bg} ${type.text}`}>
                          {type.label}
                        </span>
                        {activity.type === 'survey' && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                            📊 {activity.jumlah_pangkas || 0} pangkas, {activity.jumlah_tebang || 0} tebang
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{activity.action}</p>
                      {activity.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </p>
                      )}
                    </div>
                    
                    {/* Status & Time */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {activity.type !== 'survey' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${status.bg}`}>
                          <StatusIcon className={`h-3 w-3 ${status.text}`} />
                          <span className={`text-xs ${status.text}`}>{status.label}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        <span title={moment(activityDate).format('DD/MM/YYYY HH:mm')}>
                          {formatTimeAgo(activityDate)}
                        </span>
                      </div>
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