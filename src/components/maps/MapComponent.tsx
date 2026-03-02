'use client'

import { useEffect, useRef } from 'react'

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
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])
  const leafletRef = useRef<any>(null)

  // =============================
  // INIT MAP (SAFE FOR SSR)
  // =============================
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    const initMap = async () => {
      const L = await import('leaflet')

      leafletRef.current = L

      // Fix icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current!).setView(center, zoom)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapRef.current)
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [center, zoom])

  // =============================
  // UPDATE MARKERS
  // =============================
  useEffect(() => {
    if (!leafletRef.current || !mapRef.current) return

    const L = leafletRef.current

    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    if (locations.length === 0) return

    const bounds = L.latLngBounds([])

    locations.forEach(location => {
      const { lat, lng, name, type } = location

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

      const icon = L.divIcon({
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
          ">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current)

      marker.bindPopup(`
        <div>
          <strong>${name}</strong><br/>
          Tipe: ${type}<br/>
          Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </div>
      `)

      markersRef.current.push(marker)
      bounds.extend([lat, lng])
    })

    mapRef.current.fitBounds(bounds, { padding: [50, 50] })
  }, [locations])

  // =============================
  // CONTROLS
  // =============================
  const handleZoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapRef.current?.zoomOut()
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      />

      {showControls && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: '#1f2937',
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 1000,
          }}
        >
          <button onClick={handleZoomIn}>+</button>
          <button onClick={handleZoomOut}>−</button>
        </div>
      )}
    </div>
  )
}