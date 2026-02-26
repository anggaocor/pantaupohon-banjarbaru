// app/page.tsx
import Button from '@/src/components/ui/Button'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Map, 
  BarChart3, 
  Download, 
  TreePine, 
  Users, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Leaf,
  Camera,
  FileText,
  Menu
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen relative bg-gray-900 overflow-x-hidden">
      {/* Background Image dengan Overlay yang Lebih Baik */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/bg.jpg"
          alt="Background"
          fill
          className="object-cover object-center scale-105"
          priority
          quality={100}
          sizes="100vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        {/* Gradient Overlay Multi-layer untuk efek lebih dalam */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/85 to-gray-900/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>
      
      {/* Konten */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Navbar Sederhana */}
        <nav className="flex justify-between items-center mb-12 sm:mb-16 lg:mb-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TreePine className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">SIPANTARU</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden sm:flex gap-3">
            <Link href="/login">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500">
                Daftar
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="sm:hidden p-2 rounded-lg bg-gray-800/50 border border-gray-700">
            <Menu className="h-5 w-5 text-white" />
          </button>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4 sm:mb-6">
            <Leaf className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
            <span className="text-xs sm:text-sm text-emerald-400">Sistem Pemantauan Pohon Digital</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Selamat Datang di{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent block sm:inline">
              SIPANTARU
            </span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Aplikasi dashboard lengkap untuk pemantauan, pengelolaan, dan analisis data pohon 
            di Kota Banjarbaru dengan visualisasi peta interaktif.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="#fitur" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                Pelajari Fitur
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-16 sm:mb-20 lg:mb-24 px-2 sm:px-0">
          {[
            { label: 'Pohon Terdata', value: '2.500+', icon: TreePine },
            { label: 'Pengguna Aktif', value: '150+', icon: Users },
            { label: 'Survey Selesai', value: '800+', icon: Camera },
            { label: 'Laporan Tersedia', value: '50+', icon: FileText },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:scale-105 transition-transform duration-300">
                <Icon className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Fitur Section */}
        <div id="fitur" className="mb-16 sm:mb-20 lg:mb-24">
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Fitur <span className="text-emerald-400">Unggulan</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
              Berbagai fitur canggih untuk memudahkan pemantauan dan pengelolaan data pohon
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
            {[
              {
                icon: Map,
                title: 'Visualisasi Peta',
                description: 'Tampilkan data geografis dengan peta interaktif, marker custom, dan informasi detail setiap lokasi.',
                color: 'blue'
              },
              {
                icon: BarChart3,
                title: 'Analisis Data',
                description: 'Grafik dan laporan interaktif untuk analisis tren pemeliharaan, pemangkasan, dan penebangan pohon.',
                color: 'green'
              },
              {
                icon: Download,
                title: 'Export & Laporan',
                description: 'Ekspor data ke CSV, print laporan, dan bagikan informasi dengan mudah ke berbagai format.',
                color: 'yellow'
              },
              {
                icon: Camera,
                title: 'Dokumentasi Survey',
                description: 'Upload foto hasil survey lapangan, kelola dokumentasi setiap kegiatan pemeliharaan pohon.',
                color: 'purple'
              },
              {
                icon: Shield,
                title: 'Keamanan Data',
                description: 'Sistem login aman, manajemen user, dan kontrol akses berbasis role (admin/petugas/user).',
                color: 'red'
              },
              {
                icon: Users,
                title: 'Manajemen User',
                description: 'Kelola pengguna dengan role berbeda, pantau aktivitas, dan atur hak akses masing-masing.',
                color: 'indigo'
              }
            ].map((fitur, index) => {
              const Icon = fitur.icon
              const colors = {
                blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
                green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
                yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400',
                purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
                red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
                indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400'
              }
              
              return (
                <div 
                  key={index} 
                  className={`group bg-gradient-to-br ${colors[fitur.color as keyof typeof colors]} backdrop-blur-sm border rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 cursor-pointer`}
                >
                  <div className="mb-3 sm:mb-4">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-white mb-2">{fitur.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{fitur.description}</p>
                  <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Pelajari lebih lanjut</span>
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12 mb-16 sm:mb-20 lg:mb-24 mx-2 sm:mx-0">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                Siap untuk memulai?
              </h3>
              <p className="text-sm sm:text-base text-gray-400 max-w-xl">
                Bergabunglah dengan SIPANTARU sekarang dan kelola data pemantauan pohon dengan lebih efisien.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-3">
                  Daftar Gratis
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10 px-6 sm:px-8 py-3">
                  Masuk
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="mb-16 sm:mb-20 lg:mb-24 px-2 sm:px-0">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Apa Kata <span className="text-emerald-400">Pengguna</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
              Testimoni dari pengguna yang telah menggunakan SIPANTARU
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                name: 'Sirajoni, A.P., M.M.',
                role: 'Kepala Dinas Lingkungan Hidup Kota Banjarbaru',
                content: 'SIPANTARU sangat membantu dalam memantau kondisi pohon di kota Banjarbaru. Data tersaji dengan rapi dan mudah diakses.'
              },
              {
                name: 'Ahmad Zaidul Khair, S.Hut.',
                role: 'Petugas Lapangan',
                content: 'Fitur survey lapangan dengan upload foto memudahkan dokumentasi kegiatan pemeliharaan pohon setiap hari.'
              },
              {
                name: 'Ahmad Hidayat',
                role: 'Masyarakat',
                content: 'Saya bisa mengajukan permohonan pemangkasan pohon dengan mudah dan memantau statusnya secara real-time.'
              }
            ].map((testi, index) => (
              <div key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <CheckCircle key={i} className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4 italic">"{testi.content}"</p>
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base">{testi.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{testi.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-6 sm:pt-8 px-2 sm:px-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <TreePine className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-base sm:text-lg font-bold text-white">SIPANTARU</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Sistem Informasi Pemantauan Pohon Kota Banjarbaru
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm sm:text-base mb-2 sm:mb-3">Produk</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Fitur</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Harga</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm sm:text-base mb-2 sm:mb-3">Perusahaan</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Tentang</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Karir</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm sm:text-base mb-2 sm:mb-3">Legal</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privasi</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Ketentuan</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Kebijakan</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 py-4 sm:py-6 text-center">
            <p className="text-xs sm:text-sm text-gray-500 px-2">
              © {new Date().getFullYear()} PT. Berkah Adha Kreasindo. All rights reserved. 
              <span className="mx-1 sm:mx-2 text-gray-700">|</span>
              <span className="text-emerald-400">v. 2.0.0</span>
              <span className="mx-1 sm:mx-2 text-gray-700">|</span>
              <span className="block sm:inline mt-1 sm:mt-0">Developed with ❤️ in Banjarbaru</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}