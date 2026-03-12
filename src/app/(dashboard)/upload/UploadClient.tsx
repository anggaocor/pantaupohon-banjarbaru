'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

export default function UploadClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      // Fetch data di sini
      const { data } = await supabase.from('your_table').select('*')
      setData(data)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {/* Konten upload Anda di sini */}
      <h1>Halaman Upload</h1>
    </div>
  )
}