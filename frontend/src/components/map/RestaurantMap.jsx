import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, ArrowRight, Star } from 'lucide-react';

// Custom Map center updater hook
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Custom HTML Pin Generator
const createCustomIcon = (waitMinutes, availableCount) => {
  let bgColor = '#10b981'; // green if 0-5 mins
  if (waitMinutes > 15 || availableCount === 0) {
    bgColor = '#ef4444'; // red if busy
  } else if (waitMinutes > 5) {
    bgColor = '#f59e0b'; // amber
  }

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: 800;
          font-size: 11px;
          font-family: sans-serif;
        ">${waitMinutes}m</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-pin',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 18px; height: 18px; margin: 3px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(37,99,235,0.8);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function RestaurantMap({ restaurants = [], userCoordinates, selectedRestaurantId, onSelectRestaurant }) {
  const navigate = useNavigate();
  const defaultCenter = userCoordinates?.lat ? [userCoordinates.lat, userCoordinates.lng] : [13.0604, 80.2437];

  return (
    <div className="w-full h-full min-h-[380px] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
      >
        <ChangeView center={defaultCenter} zoom={13} />
        
        {/* Dark theme open tile map layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* User GPS Pin */}
        {userCoordinates?.lat && (
          <Marker position={[userCoordinates.lat, userCoordinates.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="p-1 text-center">
                <p className="text-xs font-bold text-gray-900">📍 You are here</p>
                <p className="text-[10px] text-gray-500">Live GPS Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Restaurant Pins */}
        {restaurants.map((r) => {
          const lat = r.location?.latitude || r.latitude;
          const lng = r.location?.longitude || r.longitude;
          if (!lat || !lng) return null;

          const waitMins = r.estimatedWaitTime ?? 10;
          const availableCount = r.availableTablesCount ?? 2;

          return (
            <Marker
              key={r.id}
              position={[parseFloat(lat), parseFloat(lng)]}
              icon={createCustomIcon(waitMins, availableCount)}
              eventHandlers={{
                click: () => onSelectRestaurant && onSelectRestaurant(r.id)
              }}
            >
              <Popup>
                <div className="w-56 p-1 text-white">
                  <img
                    src={r.image_url}
                    alt={r.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <h4 className="font-bold text-sm text-gray-900 leading-tight">{r.name}</h4>
                  <p className="text-[11px] text-gray-600 truncate mt-0.5">{r.cuisine}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-xs">
                    <span className="flex items-center gap-1 font-bold text-orange-600">
                      <Clock className="w-3.5 h-3.5" />
                      ~{waitMins} min wait
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Users className="w-3.5 h-3.5" />
                      {availableCount} tables
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/restaurant/${r.id}`)}
                    className="w-full mt-3 py-1.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <span>View & Pre-Order</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] glass-panel rounded-xl px-3 py-2 text-[10px] space-y-1 text-gray-300 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Fast Seating (&lt; 5m)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Moderate Wait (5-15m)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Busy / Full (&gt; 15m)</span>
        </div>
      </div>
    </div>
  );
}
