'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/src/components/ui/Button'
import Input from '@/src/components/ui/Input'
import { toast } from 'sonner'
import { signUp } from '@/src/lib/supabase/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password dan konfirmasi password tidak sama')
      return
    }
    
    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await signUp(
        formData.email, 
        formData.password,
        { name: formData.name } // Metadata tambahan
      )
      
      if (error) {
        throw error
      }
      
      if (data?.user) {
        toast.success('Registrasi berhasil! Silakan cek email untuk verifikasi.')
        router.push('/login')
      } else if (data?.session) {
        toast.success('Registrasi berhasil! Anda akan dialihkan ke dashboard.')
        router.push('/dashboard')
      }
    } catch (error: unknown) {
      console.error('Register error:', error)
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? String((error as { message: string }).message)
        : 'Registrasi gagal. Silakan coba lagi.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Daftar Akun Baru
          </h2>
          <p className="mt-2 text-gray-600">
            Buat akun untuk mulai menggunakan SIPANTARU
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Nama Lengkap"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="John Doe"
              autoComplete="name"
            />
            
            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="nama@email.com"
              autoComplete="email"
            />
            
            <Input
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
            
            <Input
              label="Konfirmasi Password"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Ulangi password"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              Saya menyetujui{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                Kebijakan Privasi
              </Link>
            </label>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-bold text-green-600 hover:text-green-500">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}