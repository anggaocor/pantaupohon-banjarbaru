'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Moon,
  Sun,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import { toast } from 'sonner'

interface HeaderProps {
  toggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export default function Header({ toggleSidebar, isSidebarOpen }: HeaderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        // Fetch profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Berhasil logout')
      router.push('/login')
      router.refresh()
    } catch (error: any) {
      toast.error('Logout gagal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  if (!user) return null

  return (
    <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Menu and Title */}
          <div className="flex items-center gap-4">
            {/* Menu Button (for mobile) */}
            {toggleSidebar && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* Institution Title */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Dinas Lingkungan Hidup
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Kota Banjarbaru
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Actions and Profile */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              onClick={() => toast.info('Fitur pencarian akan segera hadir')}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notification Button */}
            <button
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors relative"
              onClick={() => toast.info('Fitur notifikasi akan segera hadir')}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors hidden md:block"
              title={isFullscreen ? 'Keluar fullscreen' : 'Mode fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span className="text-white text-sm font-medium">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {profile?.full_name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <>
                  {/* Backdrop untuk menutup menu */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 z-50 rounded-xl bg-gray-800 border border-gray-700 shadow-2xl overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">
                        {profile?.full_name || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-sm">Profil Saya</span>
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">Pengaturan</span>
                      </Link>

                      <div className="border-t border-gray-700 my-2"></div>

                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600/20 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm flex-1 text-left">
                          {loading ? 'Logout...' : 'Keluar'}
                        </span>
                        {loading && (
                          <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </button>
                    </div>

                    {/* Version Info */}
                    <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700">
                      <p className="text-xs text-gray-500">Versi 2.0.0</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}