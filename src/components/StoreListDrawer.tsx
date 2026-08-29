import React, { useState, useMemo } from 'react';
import { X, Star, MapPin, Navigation, ExternalLink, Sparkles, Filter, ChevronRight, Gift, Utensils, Coffee } from 'lucide-react';
import { AffiliateStore } from '../types';
import { CAMPUS_CENTER, getDistanceMeters, formatDistance } from '../data/campus';

interface StoreListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stores: AffiliateStore[];
  selectedStore: AffiliateStore | null;
  onSelectStore: (store: AffiliateStore) => void;
  favoriteIds: string[];
  onToggleFavorite: (storeId: string) => void;
  userLocation: { lat: number; lng: number } | null;
}

type SortOption = 'default' | 'name' | 'gate_distance' | 'user_distance';

export const StoreListDrawer: React.FC<StoreListDrawerProps> = ({
  isOpen,
  onClose,
  stores,
  selectedStore,
  onSelectStore,
  favoriteIds,
  onToggleFavorite,
  userLocation
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('all');

  const sortedStores = useMemo(() => {
    let list = [...stores];

    if (selectedSubtype !== 'all') {
      list = list.filter((s) => s.type === selectedSubtype || s.subType === selectedSubtype);
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else if (sortBy === 'gate_distance') {
      list.sort((a, b) => {
        const distA = getDistanceMeters(a.lat, a.lng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
        const distB = getDistanceMeters(b.lat, b.lng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
        return distA - distB;
      });
    } else if (sortBy === 'user_distance' && userLocation) {
      list.sort((a, b) => {
        const distA = getDistanceMeters(a.lat, a.lng, userLocation.lat, userLocation.lng);
        const distB = getDistanceMeters(b.lat, b.lng, userLocation.lat, userLocation.lng);
        return distA - distB;
      });
    }

    return list;
  }, [stores, sortBy, selectedSubtype, userLocation]);

  if (!isOpen) return null;

  return (
    <aside className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl z-[1001] flex flex-col border-l border-slate-200/80 animate-in slide-in-from-right duration-200 backdrop-blur-xl">
      {/* Drawer Header */}
      <div className="p-4 bg-gradient-to-r from-[#8B1D24] via-[#962028] to-[#7B191F] text-white flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-base shadow-inner">
            📋
          </div>
          <div>
            <h2 className="font-bold text-[15px] tracking-tight">제휴 매장 목록</h2>
            <p className="text-xs text-red-100/90 font-normal">총 {sortedStores.length}개 제휴 매장 등록</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition border border-white/10"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sorting & Filter controls */}
      <div className="p-3 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedSubtype('all')}
            className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition active:scale-95 whitespace-nowrap ${
              selectedSubtype === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubtype('food')}
            className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition active:scale-95 whitespace-nowrap ${
              selectedSubtype === 'food'
                ? 'bg-[#8B1D24] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🍽️ 식당
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubtype('pub')}
            className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition active:scale-95 whitespace-nowrap ${
              selectedSubtype === 'pub'
                ? 'bg-[#1B365D] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🍺 주점
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubtype('cafe')}
            className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition active:scale-95 whitespace-nowrap ${
              selectedSubtype === 'cafe'
                ? 'bg-[#4A3525] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ☕ 카페
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubtype('life')}
            className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition active:scale-95 whitespace-nowrap ${
              selectedSubtype === 'life'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            💪 라이프
          </button>
        </div>

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 text-xs font-medium outline-none focus:border-[#8B1D24] focus:ring-1 focus:ring-[#8B1D24] transition shadow-xs"
        >
          <option value="default">기본 정렬</option>
          <option value="gate_distance">정문 거리순</option>
          {userLocation && <option value="user_distance">내 위치 거리순</option>}
          <option value="name">가나다순</option>
        </select>
      </div>

      {/* Store Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2.5 space-y-2.5">
        {sortedStores.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">
              🔍
            </div>
            <p className="font-bold text-slate-700 text-sm">해당 조건의 제휴 매장이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">검색어나 카테고리 필터를 변경해보세요.</p>
          </div>
        ) : (
          sortedStores.map((store) => {
            const isSelected = selectedStore?.id === store.id;
            const isFav = favoriteIds.includes(store.id);
            const distFromGate = getDistanceMeters(store.lat, store.lng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
            const distFromUser = userLocation
              ? getDistanceMeters(store.lat, store.lng, userLocation.lat, userLocation.lng)
              : null;

            let iconEmoji = '🍽️';
            let iconClass = 'bg-red-50 text-[#8B1D24] border-red-200';

            if (store.type === 'cafe') {
              iconEmoji = '☕';
              iconClass = 'bg-amber-50 text-amber-900 border-amber-200';
            } else if (store.type === 'pub') {
              iconEmoji = '🍺';
              iconClass = 'bg-blue-50 text-blue-900 border-blue-200';
            } else if (store.type === 'life') {
              iconEmoji = '💪';
              iconClass = 'bg-emerald-50 text-emerald-900 border-emerald-200';
            }

            return (
              <div
                key={store.id}
                onClick={() => onSelectStore(store)}
                className={`p-3.5 rounded-2xl transition-all border cursor-pointer relative group ${
                  isSelected
                    ? 'bg-red-50/90 border-[#8B1D24] shadow-md ring-1 ring-[#8B1D24]'
                    : 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    {store.img ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative bg-slate-100">
                        <img 
                          src={store.img} 
                          alt={store.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border ${iconClass}`}>
                        {iconEmoji}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#8B1D24] transition">
                          {store.name}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-medium px-1.5 py-0.5 rounded-md bg-slate-100">
                          {store.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{store.areaName}</span>
                        <span className="text-slate-300">•</span>
                        <span>정문 {formatDistance(distFromGate)}</span>
                        {distFromUser && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-blue-600 font-semibold">내 위치 {formatDistance(distFromUser)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(store.id);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-300 hover:text-amber-400 transition"
                    aria-label="즐겨찾기"
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Benefit Banner */}
                <div className="mt-3 bg-red-50/80 border border-red-200/80 rounded-xl px-3 py-2 flex items-start gap-2">
                  <Gift className="w-3.5 h-3.5 text-[#8B1D24] shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-[#8B1D24] leading-tight whitespace-pre-line">{store.benefit}</p>
                </div>

                {/* Desc preview */}
                {store.desc && (
                  <p className="mt-2 text-[11.5px] text-slate-600 truncate pl-1">
                    {store.desc}
                  </p>
                )}

                {/* External links */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">클릭 시 지도로 이동</span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.lat},${store.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-amber-950 bg-[#FEE500] hover:bg-[#FADA0A] px-2.5 py-1 rounded-lg transition shadow-2xs flex items-center gap-1"
                    >
                      <span>🟡</span> 카카오길찾기
                    </a>
                    <a
                      href={`https://map.naver.com/p/search/${encodeURIComponent(store.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-white bg-[#03C75A] hover:bg-[#02b350] px-2.5 py-1 rounded-lg transition shadow-2xs flex items-center gap-1"
                    >
                      <span>🟢</span> 네이버검색
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
