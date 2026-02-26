'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
})

interface Location {
  lat: number
  lng: number
  name: string
  description?: string
}

export default function CustomMap({ locations = [] }: { locations?: Location[] }) {
  const [center, setCenter] = useState<[number, number]>([-6.2, 106.8]) // Default Jakarta

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '500px', width: '100%' }}
      className="rounded-lg shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location, index) => (
        <Marker key={index} position={[location.lat, location.lng]}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{location.name}</h3>
              <p>{location.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}