"use client";
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Custom Map Pin Icon using Leaflet divIcon and lucide SVG inside
const customMarkerIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>`,
  className: 'custom-pin-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function MapPickerModal({ isOpen, onClose, onSendLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Default coordinate (Hanoi centre)
  const defaultCoords = [21.028511, 105.804817];

  // Initialize Leaflet map
  useEffect(() => {
    if (!isOpen) return;

    // Small timeout to allow the modal transition/DOM rendering to complete
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false // Position zoom control manually or leave standard
      }).setView(defaultCoords, 14);

      mapRef.current = map;

      // Add zoom control at bottom-left to keep top-right clean for search results/buttons
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Setup initial marker
      const marker = L.marker(defaultCoords, {
        icon: customMarkerIcon,
        draggable: true
      }).addTo(map);

      markerRef.current = marker;
      setSelectedCoords(defaultCoords);

      // Listeners
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setSelectedCoords([position.lat, position.lng]);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setSelectedCoords([lat, lng]);
      });

      // Automatically locate current position on opening
      handleGetMyLocation();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // Geocoding query response using OpenStreetMap Nominatim
  useEffect(() => {
    if (!selectedCoords) {
      setAddress('');
      return;
    }

    const fetchAddress = async () => {
      setLoadingAddress(true);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCoords[0]}&lon=${selectedCoords[1]}&accept-language=vi,en`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'DNT-Contact-App/1.0'
          }
        });
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress(`Tọa độ: ${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`);
        }
      } catch (err) {
        console.error('Error in reverse geocoding:', err);
        setAddress(`Tọa độ: ${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`);
      } finally {
        setLoadingAddress(false);
      }
    };

    const debounceTimer = setTimeout(fetchAddress, 600);
    return () => clearTimeout(debounceTimer);
  }, [selectedCoords]);

  // Get GPS Location
  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Thiết bị không hỗ trợ định vị.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        setSelectedCoords(coords);

        if (mapRef.current) {
          mapRef.current.setView(coords, 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng(coords);
        }
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Do not alert on start, since user might block geolocation, just set default
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Search Address
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1&accept-language=vi,en`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'DNT-Contact-App/1.0'
        }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const coords = [parseFloat(lat), parseFloat(lon)];
        setSelectedCoords(coords);

        if (mapRef.current) {
          mapRef.current.setView(coords, 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng(coords);
        }
      } else {
        alert('Không tìm thấy kết quả nào cho địa chỉ này.');
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('Đã xảy ra lỗi khi tìm kiếm địa chỉ.');
    } finally {
      setSearching(false);
    }
  };

  const handleSend = () => {
    if (!selectedCoords) return;
    onSendLocation(selectedCoords[0], selectedCoords[1], address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300000] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden transition-all transform scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <MapPin className="text-red-500" size={20} />
              Gửi vị trí bản đồ
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Chọn vị trí bằng cách kéo ghim hoặc tìm kiếm địa chỉ</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search input bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập địa chỉ cần tìm... (Ví dụ: Hồ Gươm, Hà Nội)"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {searching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </form>
        </div>

        {/* Map Area */}
        <div className="relative w-full h-[380px] bg-gray-100">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
          
          {/* Floating Current Location Button */}
          <button
            type="button"
            onClick={handleGetMyLocation}
            disabled={locating}
            className="absolute bottom-5 right-5 z-20 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-lg hover:bg-gray-50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            <Navigation className={`text-blue-600 ${locating ? 'animate-spin' : ''}`} size={16} />
            {locating ? 'Đang xác vị...' : 'Vị trí hiện tại'}
          </button>
        </div>

        {/* Geocoded Address Box */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-1">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Địa chỉ đã chọn</div>
          <div className="text-sm text-gray-800 font-medium min-h-[40px] leading-relaxed flex items-start gap-2">
            <MapPin className="text-red-500 shrink-0 mt-0.5" size={16} />
            <div>
              {loadingAddress ? (
                <span className="text-gray-400 italic">Đang phân tích địa chỉ tọa độ...</span>
              ) : (
                address || 'Chưa chọn vị trí'
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!selectedCoords || loadingAddress}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all hover:translate-y-[-1px] disabled:pointer-events-none"
          >
            Gửi vị trí này
          </button>
        </div>
      </div>
    </div>
  );
}

MapPickerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSendLocation: PropTypes.func.isRequired,
};
