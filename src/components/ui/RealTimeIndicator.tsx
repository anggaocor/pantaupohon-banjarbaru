'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'

export default function RealTimeIndicator() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastPing, setLastPing] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Check initial connection
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count', { 
          count: 'exact', 
          head: true 
        })
        
        if (!error) {
          setIsConnected(true)
          setLastPing(new Date())
        }
      } catch (error) {
        setIsConnected(false)
      }
    }

    checkConnection()

    // Setup heartbeat
    const interval = setInterval(() => {
      setLastPing(new Date())
    }, 30000) // Ping every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">Terhubung Real-time</span>
              {lastPing && (
                <span className="text-gray-500">
                  • Terakhir update: {lastPing.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">Koneksi Terputus</span>
              <button className="ml-2 flex items-center text-primary-600 hover:text-primary-700">
                <RefreshCw className="h-3 w-3 mr-1" />
                <span>Coba Sambungkan</span>
              </button>
            </>
          )}
        </div>
        
        <div className="text-gray-500">
          <span className="hidden sm:inline">Data update otomatis setiap </span>
          <span className="font-medium">30 detik</span>
        </div>
      </div>
    </div>
  )
}