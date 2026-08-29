import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AffiliateStore, CampusLandmark } from '../types';
import { CAMPUS_CENTER, CAMPUS_LANDMARKS, getDistanceMeters, formatDistance } from '../data/campus';

interface LeafletMapProps {
  stores: AffiliateStore[];
  selectedStore: AffiliateStore | null;
  onSelectStore: (store: AffiliateStore | null) => void;
  userLocation: { lat: number; lng: number } | null;
  favoriteIds: string[];
  onToggleFavorite: (storeId: string) => void;
  onCopyInfo: (text: string) => void;
  gateFocusTrigger?: number;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  stores,
  selectedStore,
  onSelectStore,
  userLocation,
  favoriteIds,
  onToggleFavorite,
  onCopyInfo,
  gateFocusTrigger
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);
  const gateMarkerRef = useRef<L.Marker | null>(null);
  const storeMarkerMapRef = useRef<{ [id: string]: L.Marker }>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
      zoom: CAMPUS_CENTER.zoom,
      zoomControl: false
    });

    // Add Zoom Control at bottom right
    L.control
      .zoom({
        position: 'bottomright'
      })
      .addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap | KYUNGHEE ROAD'
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const landmarksGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    landmarksLayerRef.current = landmarksGroup;
    mapInstanceRef.current = map;

    // Add Campus Landmarks
    CAMPUS_LANDMARKS.forEach((landmark) => {
      const isGate = landmark.id === 'khu-main-gate' || landmark.category === 'gate';
      const landmarkIcon = isGate
        ? L.divIcon({
            className: 'gate-marker-wrapper',
            html: `
              <div class="single-gate-marker-pulse">
                <span>🏛️</span>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
          })
        : L.divIcon({
            className: 'custom-landmark-marker-wrapper',
            html: `
              <div class="custom-landmark-marker">
                <span>${landmark.icon}</span>
                <span>${landmark.name}</span>
              </div>
            `,
            iconSize: [120, 26],
            iconAnchor: [60, 13]
          });

      const marker = L.marker([landmark.lat, landmark.lng], { icon: landmarkIcon });
      const popupHtml = isGate
        ? `
          <div style="padding: 10px 12px; text-align: center; font-family: sans-serif;">
            <div style="font-size: 24px; margin-bottom: 4px;">🏛️</div>
            <h4 style="color:#8B1D24; font-size:14px; font-weight:800; margin-bottom:4px;">경희대학교 국제캠퍼스 정문</h4>
            <p style="font-size:11.5px; color:#555; margin:0;">제휴 매장들의 중심 기준점입니다.</p>
          </div>
        `
        : `
          <div class="p-3 text-center font-sans">
            <div class="text-2xl mb-1">${landmark.icon}</div>
            <p class="font-black text-gray-900 text-sm">${landmark.name}</p>
            ${landmark.nameEn ? `<p class="text-xs text-gray-500 mt-0.5">${landmark.nameEn}</p>` : ''}
            <div class="mt-2 bg-red-50 text-[#8B1D24] text-[11px] font-bold py-1.5 px-2 rounded-lg border border-red-100">
              경희대학교 국제캠퍼스 주요 건물
            </div>
          </div>
        `;
      marker.bindPopup(popupHtml);
      marker.addTo(landmarksGroup);
      if (isGate) {
        gateMarkerRef.current = marker;
      }
    });

    // Map Click for Reverse Geocoding
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (clickMarkerRef.current) {
        map.removeLayer(clickMarkerRef.current);
      }

      const clickIcon = L.divIcon({
        className: 'click-marker',
        html: `
          <div class="bg-gray-900 text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-md border border-white flex items-center gap-1">
            <span>📍</span>
            <span>선택 위치</span>
          </div>
        `,
        iconSize: [70, 24],
        iconAnchor: [35, 24]
      });

      const clickMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
      clickMarkerRef.current = clickMarker;
      clickMarker.bindPopup('<div class="p-2 text-xs text-gray-600">주소 확인 중...</div>').openPopup();

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`
        );
        const data = await response.json();
        const placeName = data.display_name || '선택한 위치';
        const distFromGate = getDistanceMeters(lat, lng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);

        clickMarker.setPopupContent(`
          <div class="p-3 text-xs leading-relaxed">
            <div class="font-bold text-gray-900 flex items-center gap-1 mb-1">
              <span>📍 선택한 위치</span>
            </div>
            <p class="text-gray-600 text-[11px] mb-2 line-clamp-2">${placeName}</p>
            <div class="bg-gray-100 p-1.5 rounded text-[11px] text-gray-700 font-medium">
              🏛️ 정문에서 거리: <b>${formatDistance(distFromGate)}</b>
            </div>
            <div class="mt-2 text-[10px] text-gray-400">
              좌표: ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
          </div>
        `);
      } catch {
        clickMarker.setPopupContent(`
          <div class="p-2 text-xs">
            <p class="font-bold text-gray-800">선택 위치 좌표</p>
            <p class="text-gray-500 text-[11px]">${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
          </div>
        `);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when stores change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();
    storeMarkerMapRef.current = {};

    stores.forEach((store) => {
      const isCafe = store.type === 'cafe';
      const isPub = store.type === 'pub';
      const isLife = store.type === 'life';
      const isSelected = selectedStore?.id === store.id;
      const isFavorite = favoriteIds.includes(store.id);

      let markerClass = '';
      let iconEmoji = '🍽️';

      if (isCafe) {
        markerClass = 'cafe';
        iconEmoji = '☕';
      } else if (isPub) {
        markerClass = 'pub';
        iconEmoji = '🍺';
      } else if (isLife) {
        markerClass = 'life';
        iconEmoji = '💪';
      }

      const iconHtml = `
        <div id="marker-${store.id}" class="pin-marker ${markerClass} ${isSelected ? 'active' : ''}">
          <span>${iconEmoji}</span>
          ${isFavorite ? '<span class="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-black border border-white shadow-xs">★</span>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-pin-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });

      const marker = L.marker([store.lat, store.lng], { icon: customIcon });

      // Hover tooltip showing store name
      marker.bindTooltip(store.name, {
        direction: 'top',
        className: 'custom-tooltip',
        offset: [0, -14]
      });

      // Calculate distance from KHU main gate
      const distFromGate = getDistanceMeters(store.lat, store.lng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
      const distFromUser = userLocation
        ? getDistanceMeters(store.lat, store.lng, userLocation.lat, userLocation.lng)
        : null;

      // Popup Content Template
      const kakaoNavUrl = `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.lat},${store.lng}`;
      const naverSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(store.name)}`;
      const storeImg = store.img || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60';

      const formattedBenefit = store.benefit.replace(/\n/g, '<br/>');

      const popupHtml = `
        <div class="popup-card bg-white font-sans text-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div class="w-full h-32 bg-slate-100 relative overflow-hidden">
            <img 
              src="${storeImg}" 
              alt="${store.name}" 
              class="w-full h-full object-cover" 
              onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60'"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
            <div class="absolute top-2.5 left-2.5">
              <span class="bg-[#fee500] text-[#191919] font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-sm">
                KYUNGHEE ROAD
              </span>
            </div>
            <div class="absolute bottom-2 left-2.5 right-2.5 text-white">
              <p class="font-bold text-sm leading-tight text-white drop-shadow-md">${store.name}</p>
            </div>
          </div>

          <div class="p-3">
            <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 flex-wrap gap-1">
              <span class="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">${store.category}</span>
              <span>🏛️ 정문 ${formatDistance(distFromGate)}</span>
            </div>

            <p class="text-[11px] text-slate-500 mb-1.5 flex items-start gap-1">
              <span>📍</span> <span class="line-clamp-1">${store.addr || store.address || store.areaName}</span>
            </p>

            ${store.desc ? `
              <p class="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg mb-2 leading-relaxed border border-slate-100">
                ${store.desc}
              </p>
            ` : ''}

            <div class="bg-red-50/90 border border-red-200/90 rounded-xl p-2.5 mb-2.5">
              <div class="text-[11px] font-bold text-[#8B1D24] flex items-center gap-1 mb-1">
                <span>🎁</span> 제휴 혜택
              </div>
              <div class="text-xs font-semibold text-slate-900 leading-relaxed">
                ${formattedBenefit}
              </div>
            </div>

            <div class="flex gap-1.5 mt-1">
              <a 
                href="${kakaoNavUrl}" 
                target="_blank" 
                rel="noreferrer"
                class="flex-1 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] text-[11px] font-bold py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-1 shadow-xs"
              >
                <span>🟡</span> 카카오길찾기
              </a>
              <a 
                href="${naverSearchUrl}" 
                target="_blank" 
                rel="noreferrer"
                class="flex-1 bg-[#03C75A] hover:bg-[#02b350] text-white text-[11px] font-bold py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-1 shadow-xs"
              >
                <span>🟢</span> 네이버검색
              </a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 285,
        minWidth: 260
      });

      marker.on('click', () => {
        onSelectStore(store);
      });

      marker.addTo(markersGroup);
      storeMarkerMapRef.current[store.id] = marker;
    });
  }, [stores, selectedStore, favoriteIds, userLocation]);

  // Handle selectedStore FlyTo & Popup open
  useEffect(() => {
    if (!selectedStore || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    map.flyTo([selectedStore.lat, selectedStore.lng], 17, {
      duration: 0.8
    });

    const marker = storeMarkerMapRef.current[selectedStore.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 400);
    }
  }, [selectedStore]);

  // Handle User Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-gps-marker-wrapper',
          html: `
            <div class="user-gps-marker">
              <div class="user-gps-pulse"></div>
              <div class="user-gps-dot"></div>
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
        userMarker.bindPopup(`
          <div class="p-2 text-center text-xs font-semibold text-blue-700">
            📍 현재 내 위치
          </div>
        `);
        userMarker.addTo(map);
        userMarkerRef.current = userMarker;
      }
    }
  }, [userLocation]);

  // Handle Gate Focus Trigger
  useEffect(() => {
    if (!gateFocusTrigger || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.flyTo([CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], 17, {
      duration: 1.2
    });

    if (gateMarkerRef.current) {
      setTimeout(() => {
        gateMarkerRef.current?.openPopup();
      }, 500);
    }
  }, [gateFocusTrigger]);

  return <div id="map" ref={mapContainerRef} className="w-full h-full relative" />;
};
