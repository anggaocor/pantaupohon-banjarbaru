'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Map, 
  FileText,
  Mail,
  Footprints,
  User,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  Search,
  TreePine,
  UploadCloudIcon
} from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import { toast } from 'sonner'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Peta', href: '/maps', icon: Map },
  { name: 'Laporan', href: '/laporan', icon: FileText },
  { name: 'Input Surat', href: '/input', icon: Mail },
  { name: 'Input Survey', href: '/survey', icon: Footprints },
  { name: 'Profil', href: '/profile', icon: User },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
  { name: 'Upload Data Excel/CSV', href: '/upload', icon: UploadCloudIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Berhasil logout')
      window.location.href = '/login'
    } catch (error) {
      toast.error('Gagal logout')
    }
  }

  const getRoleBadge = () => {
    // This would come from user metadata or profiles table
    return 'user'
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop Sidebar */}
      <div className={`
        hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'lg:w-20' : 'lg:w-72'}
      `}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 px-4 border-r border-gray-700 shadow-2xl">
          
          {/* Logo Area */}
          <div className="flex h-20 shrink-0 items-center justify-between px-2 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <TreePine className="h-6 w-6 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-bold text-xl text-white">SIPANTARU</h1>
                  <p className="text-xs text-gray-400">Sistem Pemantauan Pohon</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* User Info */}
          {!collapsed && user && (
            <div className="px-3 py-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {collapsed && user && (
            <div className="py-4 flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-4">
              <li>
                <ul role="list" className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                            ${isActive 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                              : 'text-gray-300 hover:text-white hover:bg-gray-800'
                            }
                            ${collapsed ? 'justify-center' : ''}
                          `}
                          title={collapsed ? item.name : ''}
                        >
                          <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          }`} />
                          {!collapsed && <span>{item.name}</span>}
                          
                          {/* Active Indicator */}
                          {isActive && !collapsed && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* Bottom Section */}
              <li className="mt-auto pt-4 border-t border-gray-700">
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className={`
                    w-full flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium
                    text-gray-300 hover:text-white hover:bg-red-600/20 hover:border-red-600/30
                    transition-all group
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? 'Logout' : ''}
                >
                  <LogOut className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-400 transition-transform group-hover:scale-110" />
                  {!collapsed && <span>Logout</span>}
                </button>

                {/* Version Info */}
                {!collapsed && (
                  <div className="mt-4 px-3 py-2">
                    <p className="text-xs text-gray-500">Versi 2.0.0</p>
                    <p className="text-xs text-gray-600 mt-1">© {new Date().getFullYear()} SIPANTARU</p>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Sidebar */}
          <div className="relative flex w-72 flex-col bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="flex h-20 items-center justify-between px-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <TreePine className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-white">SIPANTARU</h1>
                  <p className="text-xs text-gray-400">Sistem Pemantauan Pohon</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {/* User Info Mobile */}
            {user && (
              <div className="px-4 py-4 bg-gray-800/50 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Mobile */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setShowMobileMenu(false)}
                        className={`
                          flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium
                          ${isActive 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${
                          isActive ? 'text-white' : 'text-gray-400'
                        }`} />
                        <span>{item.name}</span>
                        
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Logout Mobile */}
            <div className="border-t border-gray-700 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-red-600/20 transition-all"
              >
                <LogOut className="h-5 w-5 text-gray-400" />
                <span>Logout</span>
              </button>
              <p className="text-xs text-gray-600 text-center mt-4">Versi 1.0.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content padding untuk desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`} />
    </>
  )
}