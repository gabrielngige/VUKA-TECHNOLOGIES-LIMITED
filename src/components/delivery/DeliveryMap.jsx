import { useEffect, useRef } from 'react'
import { MapPin, Truck, Clock, CheckCircle2 } from 'lucide-react'
import { useDeliveryStore } from '../../store/index.js'
import 'leaflet/dist/leaflet.css'

const STATUS_COLOR = { transit: '#E8A020', delivered: '#2D6E35', pending: '#9CA3AF' }
const STATUS_LABEL = { transit: 'In Transit', delivered: 'Delivered', pending: 'Pending' }
// Vuka HQ: PP6V+HCR Nairobi
const HQ = { lat: -1.2885114, lng: 36.743522 }

export default function DeliveryMap() {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const { orders, updateStatus } = useDeliveryStore()

  useEffect(() => {
    // Return early if map is already initialized or container isn't ready
    if (mapInstance.current || !mapRef.current) return

    const init = async () => {
      try {
        const L = await import('leaflet')
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Check if container still exists and isn't already initialized
        if (!mapRef.current || mapRef.current._leaflet_id) return

        const map = L.map(mapRef.current, { center: [HQ.lat, HQ.lng], zoom: 12 })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)

        // HQ marker
        L.marker([HQ.lat, HQ.lng], { icon: L.divIcon({ className: '', html: `<div style="background:#2D6E35;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:16px;">🏭</div>`, iconSize:[36,36], iconAnchor:[18,18] }) })
          .addTo(map).bindPopup('<strong>Vuka Technologies HQ</strong><br/><small>PP6V+HCR Nairobi</small>')

        orders.forEach(o => {
          if (!o.lat || !o.lng) return  // skip orders with no coordinates
          const color = STATUS_COLOR[o.status]
          L.marker([o.lat, o.lng], { icon: L.divIcon({ className: '', html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:13px;">🏪</div>`, iconSize:[30,30], iconAnchor:[15,15] }) })
            .addTo(map)
            .bindPopup(`<div style="font-family:sans-serif;min-width:160px"><b>#${o.id}</b><br/>${o.customer}<br/><span style="font-size:12px;color:#666">${o.items}</span><br/><b style="color:#2D6E35">KES ${o.amount.toLocaleString()}</b></div>`)
          if (o.status === 'transit' && o.lat && o.lng) {
            L.polyline([[HQ.lat, HQ.lng],[o.lat, o.lng]], { color:'#E8A020', weight:2, dashArray:'6,6' }).addTo(map)
          }
        })
        mapInstance.current = map
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    init()

    // Cleanup function to prevent "already initialized" error
    return () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove()
          mapInstance.current = null
        } catch (error) {
          console.error('Error removing map:', error)
        }
      }
    }
  }, [orders])

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 bg-vuka-green-pale rounded-lg flex items-center justify-center"><MapPin size={18} className="text-vuka-green"/></div>
          <div><p className="font-semibold text-sm">Live Delivery Tracker</p><p className="text-xs text-gray-400">Click a marker to see order details</p></div>
          <div className="ml-auto flex gap-3 text-xs">
            {[['#E8A020','In Transit'],['#2D6E35','Delivered'],['#9CA3AF','Pending']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1 font-medium" style={{color:c}}>
                <span className="w-2 h-2 rounded-full" style={{background:c}}></span>{l}
              </span>
            ))}
          </div>
        </div>
        <div ref={mapRef} style={{ height: '380px' }} />
      </div>

      <div className="card divide-y divide-gray-50">
        <div className="p-4 flex items-center justify-between">
          <p className="font-semibold">Active Orders</p>
          <span className="text-xs bg-amber-pale text-amber-dark px-2 py-1 rounded-full font-medium">
            {orders.filter(o => o.status !== 'delivered').length} pending
          </span>
        </div>
        {orders.map(o => (
          <div key={o.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:STATUS_COLOR[o.status]}}/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">#{o.id} · <span className="text-gray-500">{o.customer}</span></p>
              <p className="text-xs text-gray-400 mt-0.5">{o.area} · {o.items}</p>
            </div>
            <p className="text-sm font-semibold text-vuka-green flex-shrink-0">KES {o.amount.toLocaleString()}</p>
            {o.status !== 'delivered' && (
              <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-amber">
                <option value="pending">Pending</option>
                <option value="transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}