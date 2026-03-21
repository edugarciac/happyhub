import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HAPPYHUB_COORDS: [number, number] = [41.37598, 2.08789];
const PARKING_COORDS: [number, number] = [41.37815, 2.08465];

// Walking route waypoints (following streets approximately)
const WALKING_ROUTE: [number, number][] = [
  PARKING_COORDS,
  [41.37780, 2.08500],
  [41.37720, 2.08580],
  [41.37680, 2.08650],
  [41.37630, 2.08720],
  [41.37610, 2.08760],
  HAPPYHUB_COORDS,
];

const happyhubIcon = new L.Icon({
  iconUrl: '/logo-happyhub-black.jpeg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'rounded-full border-2 border-white shadow-lg',
});

const parkingIcon = new L.DivIcon({
  html: `<div style="background:#2563eb;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">P</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
  className: '',
});

export default function ParkingMap() {
  const center: [number, number] = [
    (HAPPYHUB_COORDS[0] + PARKING_COORDS[0]) / 2,
    (HAPPYHUB_COORDS[1] + PARKING_COORDS[1]) / 2,
  ];

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: '400px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={HAPPYHUB_COORDS} icon={happyhubIcon}>
        <Popup>
          <strong>Happyhub</strong><br />
          C/ Rovellat, 27<br />
          08950 Esplugues de Llobregat
        </Popup>
      </Marker>

      <Marker position={PARKING_COORDS} icon={parkingIcon}>
        <Popup>
          <strong>Parking gratuito</strong><br />
          C/ Josep Anselm Clave, 114I<br />
          08950 Esplugues de Llobregat
        </Popup>
      </Marker>

      <Polyline
        positions={WALKING_ROUTE}
        pathOptions={{
          color: '#7c3aed',
          weight: 4,
          dashArray: '8, 12',
          opacity: 0.8,
        }}
      />
    </MapContainer>
  );
}
