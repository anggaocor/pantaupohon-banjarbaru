import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface DashboardStats {
  totalUsers: number
  totalData: number
  averageRating: number
  revenue: number
}

interface RealtimeDashboardData {
  stats: DashboardStats
  activities: any[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRealtimeDashboard(): RealtimeDashboardData {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalData: 0,
    averageRating: 0,
    revenue: 0,
  })
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [
        { data: users, error: usersError },
        { data: dataEntries, error: dataError },
        { data: ratings, error: ratingsError },
        { data: transactions, error: transactionsError },
        { data: recentActivities, error: activitiesError },
      ] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('data_entries').select('*'),
        supabase.from('ratings').select('rating'),
        supabase
          .from('transactions')
          .select('amount')
          .eq('status', 'completed'),
        supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (usersError) throw usersError
      if (dataError) throw dataError
      if (ratingsError) throw ratingsError
      if (transactionsError) throw transactionsError
      if (activitiesError) throw activitiesError

      // Calculate stats
      const totalUsers = users?.length || 0
      const totalData = dataEntries?.length || 0
      const averageRating = ratings?.length
        ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
        : 0
      const revenue = transactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0

      setStats({ totalUsers, totalData, averageRating, revenue })
      setActivities(recentActivities || [])

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Gagal memuat data')
      toast.error('Gagal memuat data dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Setup real-time subscriptions
  useEffect(() => {
    fetchInitialData()

    // Subscribe to real-time changes
    const channels = [
      // Profiles channel
      supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Profile change:', payload)
            
            if (payload.eventType === 'INSERT') {
              setStats(prev => ({
                ...prev,
                totalUsers: prev.totalUsers + 1,
              }))
              toast.info('Pengguna baru ditambahkan')
            } else if (payload.eventType === 'DELETE') {
              setStats(prev => ({
                ...prev,
                totalUsers: Math.max(0, prev.totalUsers - 1),
              }))
            }
          }
        )
        .subscribe(),

      // Data entries channel
      supabase
        .channel('data-entries-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'data_entries',
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Data entry change:', payload)
            
            if (payload.eventType === 'INSERT') {
              setStats(prev => ({
                ...prev,
                totalData: prev.totalData + 1,
              }))
              toast.success('Data baru ditambahkan')
            } else if (payload.eventType === 'DELETE') {
              setStats(prev => ({
                ...prev,
                totalData: Math.max(0, prev.totalData - 1),
              }))
            }
          }
        )
        .subscribe(),

      // Activities channel
      supabase
        .channel('activities-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activities',
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('New activity:', payload)
            
            const newActivity = payload.new
            setActivities(prev => [newActivity, ...prev.slice(0, 9)])
            
            // Show toast notification for important activities
            if (newActivity.action === 'login') {
              toast.info(`${newActivity.user_name} baru saja login`)
            } else if (newActivity.action === 'export') {
              toast.success(`${newActivity.user_name} mengekspor data`)
            }
          }
        )
        .subscribe(),

      // Transactions channel
      supabase
        .channel('transactions-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: 'status=eq.completed',
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('New transaction:', payload)
            
            const newTransaction = payload.new
            setStats(prev => ({
              ...prev,
              revenue: prev.revenue + newTransaction.amount,
            }))
            
            toast.success(`Transaksi baru: ${new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
            }).format(newTransaction.amount)}`)
          }
        )
        .subscribe(),

      // Ratings channel
      supabase
        .channel('ratings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ratings',
          },
          async () => {
            // Recalculate average rating
            const { data: ratings } = await supabase
              .from('ratings')
              .select('rating')
            
            if (ratings) {
              const averageRating = ratings.length
                ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
                : 0
              
              setStats(prev => ({
                ...prev,
                averageRating,
              }))
            }
          }
        )
        .subscribe(),
    ]

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [supabase, fetchInitialData])

  return {
    stats,
    activities,
    isLoading,
    error,
    refresh: fetchInitialData,
  }
}