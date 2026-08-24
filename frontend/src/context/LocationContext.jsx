import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

export const PRESET_LOCATIONS = [
  { name: 'Nungambakkam (Central)', lat: 13.0604, lng: 80.2437 },
  { name: 'Khader Nawaz Khan Rd', lat: 13.0645, lng: 80.2482 },
  { name: 'Alwarpet & TTK Road', lat: 13.0382, lng: 80.2564 },
  { name: 'Besant Nagar Beach', lat: 13.0002, lng: 80.2668 },
  { name: 'Anna Nagar West', lat: 13.0850, lng: 80.2100 }
];

export const RADIUS_OPTIONS = [1, 3, 5, 10, 25];

export const LocationProvider = ({ children }) => {
  const [coordinates, setCoordinates] = useState({ lat: 13.0604, lng: 80.2437 });
  const [locationName, setLocationName] = useState('Nungambakkam, Chennai');
  const [permissionStatus, setPermissionStatus] = useState('granted'); // 'granted', 'denied', 'disabled', 'unavailable', 'manual'
  const [accuracy, setAccuracy] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5); // Default 5km radius
  const [loading, setLoading] = useState(false);

  const requestLiveLocation = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          const acc = Math.round(pos.coords.accuracy || 10);
          setCoordinates({ lat, lng });
          setAccuracy(acc);
          setLocationName(`Live GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
          setPermissionStatus('granted');
          setLoading(false);
        },
        (err) => {
          console.warn('Geolocation denied or timed out:', err.message);
          if (err.code === 1) {
            setPermissionStatus('denied');
          } else if (err.code === 2) {
            setPermissionStatus('unavailable');
          } else {
            setPermissionStatus('disabled');
          }
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setPermissionStatus('unavailable');
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLiveLocation();
  }, []);

  const setManualLocation = (preset) => {
    setCoordinates({ lat: preset.lat, lng: preset.lng });
    setLocationName(preset.name);
    setPermissionStatus('manual');
  };

  return (
    <LocationContext.Provider
      value={{
        coordinates,
        locationName,
        permissionStatus,
        accuracy,
        searchRadius,
        setSearchRadius,
        loading,
        requestLiveLocation,
        setManualLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
