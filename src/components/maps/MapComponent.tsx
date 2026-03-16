'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'

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
  center = [-3.4431, 114.8308],
  showControls = true,
  showLegend = true,
}: MapComponentProps) {
  const mapRef = useRef<LeafletMap | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const leafletRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const locationsRef = useRef<MapLocation[]>([]) // Untuk tracking perubahan locations

  // =============================
  // GET COLOR BASED ON TYPE
  // =============================
  const getColor = useCallback((type: string) => {
    switch (type) {
      case 'permohonan': return '#3b82f6'
      case 'pemeliharaan': return '#10b981'
      case 'pemangkasan': return '#f59e0b'
      case 'penebangan': return '#ef4444'
      default: return '#6b7280'
    }
  }, [])

  // =============================
  // GET ICON EMOJI BASED ON TYPE
  // =============================
  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'permohonan': return '📄'
      case 'pemeliharaan': return '🌳'
      case 'pemangkasan': return '✂️'
      case 'penebangan': return '🪓'
      default: return '📍'
    }
  }, [])

  // =============================
  // INIT MAP - ONCE ONLY
  // =============================
  useEffect(() => {
    // Cegah inisialisasi ganda
    if (typeof window === 'undefined' || !mapContainerRef.current || isInitializedRef.current) {
      return
    }

    let isMounted = true

    const initMap = async () => {
      try {
        const L = await import('leaflet')

        if (!isMounted) return

        leafletRef.current = L

        // Fix icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Buat map baru
        const map = L.map(mapContainerRef.current!).setView(center, zoom)
        mapRef.current = map

        // Tambah tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        isInitializedRef.current = true
        console.log('Map initialized successfully')

        // Setelah map siap, tambahkan markers
        if (locationsRef.current.length > 0) {
          addMarkers(locationsRef.current)
        }

      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        isInitializedRef.current = false
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Kosongkan dependency array agar hanya jalan sekali

  // =============================
  // FUNCTION TO ADD MARKERS
  // =============================
  const addMarkers = useCallback((newLocations: MapLocation[]) => {
    if (!leafletRef.current || !mapRef.current) {
      console.log('Map not ready yet')
      return
    }

    console.log('Adding markers for locations:', newLocations)

    const L = leafletRef.current

    // Hapus marker lama
    markersRef.current.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove()
      }
    })
    markersRef.current = []

    if (newLocations.length === 0) {
      console.log('No locations to display')
      return
    }

    // Buat bounds untuk menyesuaikan tampilan peta
    const bounds = L.latLngBounds([])
    let hasValidLocations = false

    newLocations.forEach((location) => {
      const { lat, lng, name, type, status, description, jumlah_pohon } = location

      // Validasi koordinat
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for ${name}:`, lat, lng)
        return
      }

      console.log(`Adding marker for ${name} at [${lat}, ${lng}]`)

      hasValidLocations = true
      const color = getColor(type)
      const iconEmoji = getIcon(type)

      // Buat custom divIcon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${iconEmoji}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      try {
        const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current)

        // Buat popup content
        const popupContent = `
          <div style="min-width: 200px; padding: 8px;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: ${color}">
              ${iconEmoji} ${name}
            </div>
            <div><strong>Tipe:</strong> ${type}</div>
            ${status ? `<div><strong>Status:</strong> ${status.replace('_', ' ')}</div>` : ''}
            ${jumlah_pohon ? `<div><strong>Jumlah Pohon:</strong> ${jumlah_pohon}</div>` : ''}
            ${description ? `<div><strong>Keterangan:</strong> ${description}</div>` : ''}
            <div><strong>Koordinat:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
          </div>
        `

        marker.bindPopup(popupContent)
        markersRef.current.push(marker)
        bounds.extend([lat, lng])

      } catch (error) {
        console.error('Error adding marker:', error)
      }
    })

    // Sesuaikan peta dengan bounds jika ada marker valid
    if (hasValidLocations && markersRef.current.length > 0) {
      try {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        console.log('Map bounds adjusted')
      } catch (error) {
        console.error('Error fitting bounds:', error)
      }
    }
  }, [getColor, getIcon])

  // =============================
  // UPDATE MARKERS WHEN LOCATIONS CHANGE
  // =============================
  useEffect(() => {
    // Simpan locations ke ref untuk digunakan di initMap
    locationsRef.current = locations

    // Jika map sudah siap, tambahkan markers
    if (mapRef.current && leafletRef.current) {
      addMarkers(locations)
    }
  }, [locations, addMarkers])

  // =============================
  // CONTROLS
  // =============================
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }, [])

  // =============================
  // LEGEND ITEMS
  // =============================
  const legendItems = useMemo(() => [
    { color: '#3b82f6', label: 'Permohonan' },
    { color: '#10b981', label: 'Pemeliharaan' },
    { color: '#f59e0b', label: 'Pemangkasan' },
    { color: '#ef4444', label: 'Penebangan' },
  ], [])

  return (
    <div style={{ position: 'relative', width, height }}>
      <div
        ref={mapContainerRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '12px', 
          background: '#1a1a1a',
          zIndex: 1
        }}
      />

      {showControls && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: '#1f2937',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #374151',
          }}
        >
          <button
            onClick={handleZoomIn}
            style={{
              width: '32px',
              height: '32px',
              background: '#374151',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >+</button>
          <button
            onClick={handleZoomOut}
            style={{
              width: '32px',
              height: '32px',
              background: '#374151',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >−</button>
        </div>
      )}

      {showLegend && locations.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: '#1f2937',
            padding: '12px 16px',
            borderRadius: '12px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #374151',
            minWidth: '160px',
          }}
        >
          <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>
            📍 Legenda
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {legendItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '14px', 
                  height: '14px', 
                  borderRadius: '50%', 
                  background: item.color,
                }} />
                <span style={{ color: '#e5e7eb', fontSize: '12px' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '10px', 
            paddingTop: '6px', 
            borderTop: '1px solid #374151',
            fontSize: '11px',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            {locations.length} lokasi aktif
          </div>
        </div>
      )}
    </div>
  )
}