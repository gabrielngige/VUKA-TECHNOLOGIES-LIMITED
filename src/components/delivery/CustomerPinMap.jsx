import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

export default function CustomerPinMap({ onLocationSelected }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const markerRef   = useRef(null)
  const [pinned,  setPinned]  = useState(null)
  const [address, setAddress] = useState('')

  useEffect(() => {
    const init = async () => {
      const L = await import('leaflet')
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(mapRef.current, { center: [-1.2921, 36.8219], zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)

      const pinIcon = L.divIcon({ className: '', html: `<div style="background:#E8A020;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>`, iconSize:[32,32], iconAnchor:[16,32] })

      map.on('click', async ({ latlng: { lat, lng } }) => {
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else {
          markerRef.current = L.marker([lat,lng], { icon: pinIcon, draggable: true }).addTo(map)
          markerRef.current.on('dragend', ev => {
            const {lat:la, lng:ln} = ev.target.getLatLng()
            geocode(la, ln)
          })
        }
        geocode(lat, lng)
      })
      mapInstance.current = map
    }
    init()
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null } }
  }, [])

  const geocode = async (lat, lng) => {
    let addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const d = await r.json()
      addr = d.display_name?.split(',').slice(0,3).join(', ') || addr
    } catch (_) {}
    setAddress(addr)
    setPinned({ lat, lng, address: addr })
    onLocationSelected?.({ lat, lng, address: addr })
  }

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(({ coords: { latitude: lat, longitude: lng } }) => {
      mapInstance.current?.setView([lat, lng], 15)
      geocode(lat, lng)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><MapPin size={14} className="text-amber"/>Pin your delivery location</p>
        <button type="button" onClick={useMyLocation} className="flex items-center gap-1 text-xs text-vuka-green font-medium hover:underline">
          <Navigation size={12}/> Use my location
        </button>
      </div>
      <div ref={mapRef} style={{ height:'240px', borderRadius:'12px', overflow:'hidden', border:'1.5px solid #E5E7EB' }}/>
      {pinned
        ? <div className="flex items-center gap-2 bg-amber-pale border border-amber/30 rounded-lg px-3 py-2">
            <MapPin size={14} className="text-amber flex-shrink-0"/>
            <p className="text-xs text-gray-700 truncate">{address}</p>
            <span className="ml-auto text-[10px] bg-vuka-green text-white px-2 py-0.5 rounded-full flex-shrink-0">✓</span>
          </div>
        : <p className="text-xs text-gray-400 text-center">Click on the map to pin your delivery location</p>
      }
    </div>
  )
}
