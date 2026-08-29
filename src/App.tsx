import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AFFILIATE_STORES } from './data/stores';
import { CAMPUS_CENTER } from './data/campus';
import { AffiliateStore, FilterCategory } from './types';
import { Header } from './components/Header';
import { LeafletMap } from './components/LeafletMap';
import { StoreListDrawer } from './components/StoreListDrawer';
import { RandomStoreModal } from './components/RandomStoreModal';
import { RankModal } from './components/RankModal';
import { LadderModal } from './components/LadderModal';
import { FeedbackModal } from './components/FeedbackModal';
import { ChatbotModal } from './components/ChatbotModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<AffiliateStore | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankModalMode, setRankModalMode] = useState<'popular' | 'discount'>('popular');
  const [isLadderModalOpen, setIsLadderModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [gateFocusTrigger, setGateFocusTrigger] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load favorites from localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('khu_affiliate_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2800);
  }, []);

  const handleToggleFavorite = useCallback((storeId: string) => {
    setFavoriteIds((prev) => {
      const isFav = prev.includes(storeId);
      const updated = isFav ? prev.filter((id) => id !== storeId) : [...prev, storeId];
      try {
        localStorage.setItem('khu_affiliate_favorites', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save favorites', err);
      }
      showToast(isFav ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 저장되었습니다! ⭐', 'success');
      return updated;
    });
  }, [showToast]);

  // Filtered Stores calculation
  const filteredStores = useMemo(() => {
    return AFFILIATE_STORES.filter((store) => {
      // Category filter
      if (activeFilter === 'food' && store.type !== 'food') return false;
      if (activeFilter === 'pub' && store.type !== 'pub') return false;
      if (activeFilter === 'cafe' && store.type !== 'cafe') return false;
      if (activeFilter === 'life' && store.type !== 'life') return false;
      if (activeFilter === 'near_campus' && store.area !== 'campus') return false;
      if (activeFilter === 'yeongtong' && store.area !== 'yeongtong') return false;
      if (activeFilter === 'favorites' && !favoriteIds.includes(store.id)) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = store.name.toLowerCase().includes(query);
        const matchesCategory = store.category.toLowerCase().includes(query);
        const matchesBenefit = store.benefit.toLowerCase().includes(query);
        const matchesArea = store.areaName.toLowerCase().includes(query);
        const matchesTags = store.tags.some((t) => t.toLowerCase().includes(query));
        const matchesMenu = store.recommendedMenu?.toLowerCase().includes(query);

        return matchesName || matchesCategory || matchesBenefit || matchesArea || matchesTags || matchesMenu;
      }

      return true;
    });
  }, [activeFilter, searchQuery, favoriteIds]);

  // GPS User Location handler
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('브라우저에서 위치 서비스를 지원하지 않습니다.', 'error');
      return;
    }

    setIsLocating(true);
    showToast('현재 위치를 확인하고 있습니다...', 'info');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        showToast('내 위치가 지도에 표시되었습니다. 📍', 'success');
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        showToast('위치 권한을 확인해주세요.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [showToast]);

  // Campus view reset
  const handleResetCampusView = useCallback(() => {
    setSelectedStore(null);
    setGateFocusTrigger((prev) => prev + 1);
    showToast('경희대 국제캠퍼스 정문 위치로 이동했습니다. 🏛️', 'info');
  }, [showToast]);

  // Fallback search execution (supports address / store query)
  const handleSearchSubmit = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // Check if store exists in database
      const matchedStore = AFFILIATE_STORES.find(
        (s) =>
          s.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          s.category.toLowerCase().includes(trimmed.toLowerCase()) ||
          s.tags.some((t) => t.toLowerCase().includes(trimmed.toLowerCase()))
      );

      if (matchedStore) {
        setSelectedStore(matchedStore);
        showToast(`'${matchedStore.name}' 제휴 매장을 찾았습니다!`, 'success');
        return;
      }

      // External OSM Address search fallback
      try {
        showToast(`'${trimmed}' 지도 위치를 검색 중입니다...`, 'info');
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            trimmed
          )}&accept-language=ko`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          setSelectedStore({
            id: 'search-result',
            name: first.name || trimmed,
            category: '검색된 위치',
            lat,
            lng,
            type: 'food',
            benefit: '일반 장소 / 외부 주소',
            area: 'other',
            areaName: first.display_name?.split(',')[0] || '외부 위치',
            tags: []
          });
          showToast(`'${first.name || trimmed}' 위치를 표시했습니다.`, 'success');
        } else {
          showToast('검색 결과가 없습니다. 제휴 매장명이나 키워드를 확인해주세요.', 'error');
        }
      } catch (err) {
        showToast('검색 중 오류가 발생했습니다.', 'error');
      }
    },
    [showToast]
  );

  const handleFeedbackSubmit = (text: string) => {
    alert(`[의견 접수 완료]\n"${text}"\n\n학생들의 소중한 의견이 총학생회 제휴국에 정상 전달되었습니다! 감사합니다.`);
    showToast('제휴 건의 의견이 정상 등록되었습니다! 💌', 'success');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 flex flex-col font-sans select-none">
      {/* Floating Header with Brand, Search & Category Filters */}
      <Header
        stores={AFFILIATE_STORES}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectStore={setSelectedStore}
        onSearchSubmit={handleSearchSubmit}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
        onOpenRandomModal={() => setIsRandomModalOpen(true)}
        onOpenRankModal={(mode) => {
          setRankModalMode(mode);
          setIsRankModalOpen(true);
        }}
        onOpenLadderModal={() => setIsLadderModalOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen((prev) => !prev)}
        onGetLocation={handleGetLocation}
        onResetCampusView={handleResetCampusView}
        favoriteIds={favoriteIds}
        isLocating={isLocating}
      />

      {/* Main Leaflet Map Container */}
      <main className="flex-1 w-full h-full relative">
        <LeafletMap
          stores={filteredStores}
          selectedStore={selectedStore}
          onSelectStore={setSelectedStore}
          userLocation={userLocation}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
          onCopyInfo={(text) => {
            navigator.clipboard.writeText(text);
            showToast('클립보드에 복사되었습니다! 📋', 'success');
          }}
          gateFocusTrigger={gateFocusTrigger}
        />

        {/* ================= 하단 좌측 도크 (인기순/할인순/의견) ================= */}
        <div className="absolute bottom-4 left-4 z-[999] flex items-center gap-1.5 flex-wrap max-w-[min(88vw,420px)] pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setRankModalMode('popular');
              setIsRankModalOpen(true);
            }}
            className="bg-white/95 hover:bg-white active:scale-95 text-[#191919] px-3.5 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border border-[#8B1D24] transition cursor-pointer backdrop-blur-sm"
          >
            <span>🔥</span>
            <span>인기순</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRankModalMode('discount');
              setIsRankModalOpen(true);
            }}
            className="bg-white/95 hover:bg-white active:scale-95 text-[#191919] px-3.5 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border border-[#8B1D24] transition cursor-pointer backdrop-blur-sm"
          >
            <span>💸</span>
            <span>할인순</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="bg-[#2b2b2b]/95 hover:bg-[#111] active:scale-95 text-white px-3.5 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border border-[#555] transition cursor-pointer backdrop-blur-sm"
          >
            <span>💡</span>
            <span>의견 남기기</span>
          </button>
        </div>
      </main>

      {/* Side Drawer for Store List */}
      <StoreListDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        stores={filteredStores}
        selectedStore={selectedStore}
        onSelectStore={(store) => {
          setSelectedStore(store);
          // On mobile, close drawer so map is visible
          if (window.innerWidth < 640) {
            setIsDrawerOpen(false);
          }
        }}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        userLocation={userLocation}
      />

      {/* Popular / Discount Rank Modal */}
      <RankModal
        isOpen={isRankModalOpen}
        onClose={() => setIsRankModalOpen(false)}
        mode={rankModalMode}
        stores={AFFILIATE_STORES}
        onSelectStore={(store) => {
          setSelectedStore(store);
          showToast(`'${store.name}' 위치로 이동합니다. 📍`, 'info');
        }}
      />

      {/* Ladder Game Modal (오늘 뭐 먹지?) */}
      <LadderModal
        isOpen={isLadderModalOpen}
        onClose={() => setIsLadderModalOpen(false)}
        stores={AFFILIATE_STORES}
        onSelectStore={(store) => {
          setSelectedStore(store);
          showToast(`'${store.name}' 위치로 이동합니다. 📍`, 'info');
        }}
      />

      {/* Feedback Suggestion Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmitFeedback={handleFeedbackSubmit}
      />

      {/* Random Store Roulette Modal */}
      <RandomStoreModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        stores={AFFILIATE_STORES}
        onSelectStore={(store) => {
          setSelectedStore(store);
          showToast(`'${store.name}' 위치로 이동합니다.`, 'info');
        }}
        userLocation={userLocation}
      />

      {/* AI Chatbot Assistant Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen((prev) => !prev)}
        onSelectStore={(store) => {
          setSelectedStore(store);
          showToast(`'${store.name}' 위치로 이동합니다. 📍`, 'info');
        }}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} />
    </div>
  );
}
