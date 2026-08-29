import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Sparkles, Star, Navigation, List, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { AffiliateStore, FilterCategory } from '../types';

interface HeaderProps {
  stores: AffiliateStore[];
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectStore: (store: AffiliateStore) => void;
  onSearchSubmit: (query: string) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onOpenRandomModal: () => void;
  onOpenRankModal: (mode: 'popular' | 'discount') => void;
  onOpenLadderModal: () => void;
  onOpenChatbot?: () => void;
  onGetLocation: () => void;
  onResetCampusView: () => void;
  favoriteIds: string[];
  isLocating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stores,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onSelectStore,
  onSearchSubmit,
  isDrawerOpen,
  onToggleDrawer,
  onOpenRandomModal,
  onOpenRankModal,
  onOpenLadderModal,
  onOpenChatbot,
  onGetLocation,
  onResetCampusView,
  favoriteIds,
  isLocating
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Suggestions for autocomplete
  const suggestions = searchQuery.trim()
    ? stores.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.benefit.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsSearchFocused(false);
      onSearchSubmit(searchQuery);
    }
  };

  const handleSuggestionClick = (store: AffiliateStore) => {
    onSelectStore(store);
    onSearchChange(store.name);
    setIsSearchFocused(false);
  };

  const foodCount = stores.filter((s) => s.type === 'food').length;
  const pubCount = stores.filter((s) => s.type === 'pub').length;
  const cafeCount = stores.filter((s) => s.type === 'cafe').length;
  const lifeCount = stores.filter((s) => s.type === 'life').length;

  return (
    <header className="absolute top-3.5 left-3.5 right-3.5 sm:right-auto sm:w-[min(94vw,430px)] z-[1000] flex flex-col gap-2 pointer-events-none">
      {/* Top Row: Brand Header + Modern '오늘 뭐 먹지?' Button */}
      <div className="flex gap-2 items-stretch pointer-events-auto">
        <div className="flex-1 bg-[#8B1D24] text-white px-3 py-2 rounded-xl shadow-xl flex flex-col justify-center border border-white/10">
          <div className="flex items-center gap-1.5 font-extrabold text-[15px] leading-tight tracking-wide text-white">
            <span className="text-[18px] leading-none inline-block drop-shadow-xs">🦁</span>
            <span>KYUNGHEE ROAD</span>
          </div>
          <span className="text-[10px] font-normal text-white/90 pl-[24px] whitespace-nowrap">국제캠퍼스 제휴업체 지도</span>
        </div>

        <button
          type="button"
          onClick={onOpenLadderModal}
          className="modern-ladder-btn shrink-0"
        >
          <span>🎲 오늘 뭐 먹지?</span>
          <span className="sub-tag">사다리 추천 🎯</span>
        </button>
      </div>

      {/* Sub-action Row: Cumulative Savings Banner & Gate Button */}
      <div className="flex gap-1.5 items-center pointer-events-auto">
        <div className="flex-1 bg-white border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <span className="bg-[#8B1D24] text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold mr-1">누적</span>
            <span className="text-gray-700 font-bold">학우 혜택</span>
          </div>
          <div className="text-gray-700 text-[11px] font-medium">
            <span className="text-[13px] text-[#8B1D24] font-black mr-0.5">33,500원</span> 절약! 🎉
          </div>
        </div>
        <button
          type="button"
          onClick={onResetCampusView}
          className="bg-white hover:bg-gray-100 active:scale-95 border border-gray-300 text-gray-800 py-1.5 px-3 rounded-xl text-[11px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          title="경희대 국제캠퍼스 정문으로 이동"
        >
          <span>🏛️</span>
          <span>정문 위치</span>
        </button>
      </div>

      {/* Search Bar Container */}
      <div className="relative pointer-events-auto shadow-lg rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 transition-all focus-within:border-[#8B1D24] focus-within:ring-2 focus-within:ring-[#8B1D24]/15">
        <div className="flex items-center px-3.5 py-1.5 gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            id="searchInput"
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="제휴 매장·메뉴·혜택 검색 (예: 닭갈비, 피자, 할인)"
            className="w-full text-sm bg-transparent border-none outline-none py-1.5 text-slate-800 placeholder-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onSearchSubmit(searchQuery)}
            className="bg-[#8B1D24] hover:bg-[#72171d] active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition shadow-sm"
          >
            검색
          </button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {isSearchFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100">
            <div className="px-3.5 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex justify-between items-center">
              <span>제휴 매장 바로가기</span>
              <span className="text-[#8B1D24]">{suggestions.length}개 일치</span>
            </div>
            {suggestions.map((store) => (
              <button
                key={store.id}
                type="button"
                onMouseDown={() => handleSuggestionClick(store)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-red-50/70 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">{store.type === 'cafe' ? '☕' : '🍽️'}</span>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-[#8B1D24] transition truncate">
                      {store.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{store.category} · {store.areaName}</p>
                  </div>
                </div>
                <span className="text-[10.5px] bg-red-100/90 text-[#8B1D24] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 border border-red-200">
                  {store.benefit}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-bold transition shadow-xs flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#8B1D24] text-white border-[#8B1D24] shadow-[#8B1D24]/20'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border-slate-200 backdrop-blur-sm'
          }`}
        >
          <span>전체</span>
          <span className="text-[10px] opacity-75 font-normal">({stores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('food')}
          className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-bold transition shadow-xs flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
            activeFilter === 'food'
              ? 'bg-[#8B1D24] text-white border-[#8B1D24] shadow-[#8B1D24]/20'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border-slate-200 backdrop-blur-sm'
          }`}
        >
          <span>🍽️ 식당</span>
          <span className="text-[10px] opacity-75 font-normal">({foodCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('pub')}
          className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-bold transition shadow-xs flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
            activeFilter === 'pub'
              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border-slate-200 backdrop-blur-sm'
          }`}
        >
          <span>🍺 주점</span>
          <span className="text-[10px] opacity-75 font-normal">({pubCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('cafe')}
          className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-bold transition shadow-xs flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
            activeFilter === 'cafe'
              ? 'bg-[#5C3D2E] text-white border-[#5C3D2E]'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border-slate-200 backdrop-blur-sm'
          }`}
        >
          <span>☕ 카페/디저트</span>
          <span className="text-[10px] opacity-75 font-normal">({cafeCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('life')}
          className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-bold transition shadow-xs flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
            activeFilter === 'life'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border-slate-200 backdrop-blur-sm'
          }`}
        >
          <span>💪 운동/라이프</span>
          <span className="text-[10px] opacity-75 font-normal">({lifeCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('favorites')}
          className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-bold transition shadow-xs flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
            activeFilter === 'favorites'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border-slate-200 backdrop-blur-sm'
          }`}
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>찜</span>
          <span className="text-[10px] opacity-75 font-normal">({favoriteIds.length})</span>
        </button>
      </div>

      {/* Floating Control Bar for List Toggle & Campus center */}
      <div className="pointer-events-auto flex items-center gap-2 mt-0.5">
        <button
          id="btn-toggle-list"
          type="button"
          onClick={onToggleDrawer}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl shadow-md text-xs font-bold transition border active:scale-95 ${
            isDrawerOpen
              ? 'bg-[#8B1D24] text-white border-[#8B1D24]'
              : 'bg-white/95 backdrop-blur-sm text-slate-800 hover:bg-slate-50 border-slate-200/90'
          }`}
        >
          {isDrawerOpen ? <MapIcon className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          <span>{isDrawerOpen ? '지도 크게보기' : '제휴 목록 보기'}</span>
        </button>

        <button
          id="btn-campus-view"
          type="button"
          onClick={onResetCampusView}
          className="flex items-center gap-1 px-3 py-2 rounded-2xl shadow-md text-xs font-bold bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-slate-50 border border-slate-200/90 transition active:scale-95"
          title="경희대 국제캠퍼스 정문 중심으로 이동"
        >
          <span>🏛️</span>
          <span>정문 위치</span>
        </button>

        <button
          id="btn-my-location"
          type="button"
          onClick={onGetLocation}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-md text-xs font-bold transition border active:scale-95 ${
            isLocating
              ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
              : 'bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-slate-50 border-slate-200/90'
          }`}
          title="현재 내 위치 확인"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : 'text-blue-600'}`} />
          <span>{isLocating ? '위치 확인 중...' : '내 위치'}</span>
        </button>
      </div>
    </header>
  );
};
