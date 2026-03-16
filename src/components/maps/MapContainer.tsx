'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'

// Definisikan interface Location
interface Location {
  lat: number
  lng: number
  name: string
  description?: string
  type?: string
  status?: string
  jumlah_pohon?: number
}

// Fix untuk icon marker di Next.js
const fixLeafletIcon = () => {
  // Hapus icon default
  delete (L.Icon.Default.prototype as any)._getIconUrl
  
  // Set icon default dengan CDN
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

// Komponen untuk mengatur bounds map
function MapBounds({ locations }: { locations: Location[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (locations.length > 0) {
      // Buat bounds dari semua lokasi
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]))
      
      // Sesuaikan map dengan bounds, beri padding
      map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15 // Batasi zoom maksimal
      })
    }
  }, [locations, map])
  
  return null
}

export default function CustomMap({ locations = [] }: { locations?: Location[] }) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapKey, setMapKey] = useState(0)

  // Fix untuk hydration error di Next.js
  useEffect(() => {
    setIsMounted(true)
    fixLeafletIcon()
  }, [])

  // Update map key when locations change (force re-render)
  useEffect(() => {
    setMapKey(prev => prev + 1)
  }, [locations.length])

  if (!isMounted) {
    return (
      <div className="w-full h-125 bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Memuat peta...</div>
      </div>
    )
  }

  // Default center (Banjarbaru, Kalimantan Selatan)
  const defaultCenter: [number, number] = [-3.4431, 114.8308]

  // Fungsi untuk mendapatkan icon berdasarkan tipe
  const getMarkerIcon = (type?: string) => {
    const colors: Record<string, string> = {
      permohonan: '#3b82f6', // blue
      pemeliharaan: '#10b981', // green
      pemangkasan: '#f59e0b', // yellow
      penebangan: '#ef4444', // red
    }

    const color = type && colors[type] ? colors[type] : '#6b7280'

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  }

  // Tentukan center map
  const mapCenter = locations.length > 0 
    ? [locations[0].lat, locations[0].lng] as [number, number]
    : defaultCenter

  return (
    <MapContainer
      key={mapKey}
      center={mapCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl shadow-lg z-0"
      scrollWheelZoom={true}
      doubleClickZoom={true}
      zoomControl={false} // Kita akan pakai custom controls
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {locations.map((location, index) => (
        <Marker 
          key={`${location.lat}-${location.lng}-${index}`} 
          position={[location.lat, location.lng]}
          icon={getMarkerIcon(location.type)}
        >
          <Popup>
            <div className="p-2 min-w-50 max-w-75">
              <h3 className="font-bold text-gray-900 text-base mb-2 border-b pb-1">
                {location.name}
              </h3>
              
              {location.type && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">Tipe:</span>
                  <span className="text-sm capitalize px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {location.type}
                  </span>
                </div>
              )}
              
              {location.status && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">Status:</span>
                  <span className="text-sm capitalize">
                    {location.status === 'pending' && '⏳ Menunggu'}
                    {location.status === 'in_progress' && '🔄 Dalam Proses'}
                    {location.status === 'completed' && '✅ Selesai'}
                  </span>
                </div>
              )}
              
              {location.jumlah_pohon !== undefined && location.jumlah_pohon > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">Jumlah Pohon:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {location.jumlah_pohon}
                  </span>
                </div>
              )}
              
              {location.description && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{location.description}</p>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-400">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Auto-adjust bounds when locations change */}
      {locations.length > 0 && <MapBounds locations={locations} />}
    </MapContainer>
  )
}