// src/components/maps/MapComponent.tsx
'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix untuk ikon Leaflet di Next.js
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

// Types
export interface MapLocation {
  lat: number
  lng: number
  name: string
  description?: string
  type: 'permohonan' | 'pemeliharaan' | 'pemangkasan' | 'penebangan'
  status?: 'pending' | 'completed' | 'in_progress'
  jumlah_pohon?: number
}

interface MapComponentProps {
  locations: MapLocation[]
  height?: string | number
  width?: string | number
  zoom?: number
  center?: [number, number]
  showControls?: boolean
  showLegend?: boolean
}

export default function MapComponent({ 
  locations = [], 
  height = '500px',
  width = '100%',
  zoom = 13,
  center = [-3.4431, 114.8308], // Banjarbaru default
  showControls = true,
  showLegend = true
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const legendRef = useRef<HTMLDivElement>(null)

  // Inisialisasi peta
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    // Fix icons
    fixLeafletIcons()

    // Buat peta jika belum ada
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapRef.current)
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [center, zoom])

  // Update markers ketika locations berubah
  useEffect(() => {
    if (!mapRef.current) return

    // Hapus marker lama
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    if (locations.length === 0) return

    const bounds = L.latLngBounds([])
    
    // Buat marker baru
    locations.forEach((location) => {
      const { lat, lng, name, type, status, description, jumlah_pohon } = location
      
      // Tentukan warna berdasarkan tipe
      const getColor = () => {
        switch (type) {
          case 'permohonan': return '#3b82f6'
          case 'pemeliharaan': return '#10b981'
          case 'pemangkasan': return '#f59e0b'
          case 'penebangan': return '#ef4444'
          default: return '#6b7280'
        }
      }

      const color = getColor()

      // Buat icon kustom
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">
            ${type === 'permohonan' ? '📋' : 
              type === 'pemeliharaan' ? '🌳' : 
              type === 'pemangkasan' ? '✂️' : '🪓'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      })

      // Buat marker
      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current!)
      
      // Buat popup content
      const getStatusText = (status?: string) => {
        switch (status) {
          case 'completed': return '✅ Selesai'
          case 'pending': return '⏳ Menunggu'
          case 'in_progress': return '🔄 Dalam Proses'
          default: return '❓ Tidak diketahui'
        }
      }

      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color};"></div>
            <strong style="font-size: 14px;">${name}</strong>
          </div>
          ${description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${description}</p>` : ''}
          <div style="font-size: 12px; color: #666;">
            <div><strong>Tipe:</strong> ${type}</div>
            <div><strong>Status:</strong> ${getStatusText(status)}</div>
            <div><strong>Koordinat:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
            ${jumlah_pohon ? `<div><strong>Jumlah Pohon:</strong> ${jumlah_pohon}</div>` : ''}
          </div>
        </div>
      `
      
      marker.bindPopup(popupContent)

      markersRef.current.push(marker)
      bounds.extend([lat, lng])
    })

    // Sesuaikan zoom agar semua marker terlihat
    if (locations.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [locations])

  // Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }

  const handleFitBounds = () => {
    if (!mapRef.current || locations.length === 0) return

    const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]))
    mapRef.current.fitBounds(bounds, { padding: [50, 50] })
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Map Container */}
      <div 
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
      />
      
      {/* Controls */}
      {showControls && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            onClick={handleZoomIn}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
            title="Perbesar"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
            title="Perkecil"
          >
            −
          </button>
          {locations.length > 0 && (
            <button
              onClick={handleFitBounds}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: '#d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Tampilkan semua lokasi"
            >
              ⌂
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && locations.length > 0 && (
        <div
          ref={legendRef}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '140px'
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' }}>
            Legenda
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
              <span style={{ fontSize: '12px', color: '#d1d5db' }}>Permohonan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <span style={{ fontSize: '12px', color: '#d1d5db' }}>Pemeliharaan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
              <span style={{ fontSize: '12px', color: '#d1d5db' }}>Pemangkasan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
              <span style={{ fontSize: '12px', color: '#d1d5db' }}>Penebangan</span>
            </div>
          </div>
        </div>
      )}

      {/* Info when no locations */}
      {locations.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            Tidak ada lokasi untuk ditampilkan
          </p>
        </div>
      )}
    </div>
  )
}