import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, MapPin, Gift, ExternalLink, Star } from 'lucide-react';
import { AffiliateStore } from '../types';
import { CAMPUS_CENTER, getDistanceMeters, formatDistance } from '../data/campus';

interface RandomStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: AffiliateStore[];
  onSelectStore: (store: AffiliateStore) => void;
  userLocation: { lat: number; lng: number } | null;
}

export const RandomStoreModal: React.FC<RandomStoreModalProps> = ({
  isOpen,
  onClose,
  stores,
  onSelectStore,
  userLocation
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'food' | 'cafe' | 'campus'>('all');
  const [pickedStore, setPickedStore] = useState<AffiliateStore | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const eligibleStores = stores.filter((s) => {
    if (selectedType === 'food') return s.type === 'food';
    if (selectedType === 'cafe') return s.type === 'cafe';
    if (selectedType === 'campus') return s.area === 'campus';
    return true;
  });

  const pickRandom = () => {
    if (eligibleStores.length === 0) return;
    setIsSpinning(true);

    let count = 0;
    const maxSteps = 15;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleStores.length);
      setPickedStore(eligibleStores[randomIndex]);
      count++;
      if (count >= maxSteps) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 80);
  };

  useEffect(() => {
    if (isOpen) {
      pickRandom();
    }
  }, [isOpen, selectedType]);

  if (!isOpen) return null;

  const distFromGate = pickedStore
    ? getDistanceMeters(pickedStore.lat, pickedStore.lng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng)
    : null;

  return (
    <div className="fixed inset-0 z-[1050] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B1D24] via-[#962028] to-[#7B191F] text-white p-4.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-base shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] tracking-tight">오늘 뭐 먹지? 제휴 룰렛</h3>
              <p className="text-xs text-red-100/90 font-normal">경희대 제휴 맛집 랜덤 추천</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition text-white border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selector */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
              selectedType === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            전체 매장
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('food')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
              selectedType === 'food' ? 'bg-[#8B1D24] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🍽️ 밥/식당
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('cafe')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
              selectedType === 'cafe' ? 'bg-[#4A3525] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ☕ 카페/디저트
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('campus')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
              selectedType === 'campus' ? 'bg-blue-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📍 정문 근처
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center">
          {pickedStore ? (
            <div className={`transition duration-150 ${isSpinning ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200/80 mx-auto flex items-center justify-center text-3xl shadow-sm mb-3">
                {pickedStore.type === 'cafe' ? '☕' : '🍽️'}
              </div>

              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300/80 text-amber-900 text-[11px] font-bold px-3 py-0.5 rounded-full mb-2">
                <span>🎓</span> KHU 학생 제휴점
              </div>

              <h4 className="text-xl font-bold text-slate-900 mb-1">{pickedStore.name}</h4>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                {pickedStore.category} · {pickedStore.areaName}
                {distFromGate && ` (정문에서 ${formatDistance(distFromGate)})`}
              </p>

              {/* Benefit Highlight Box */}
              <div className="bg-red-50/80 border border-red-200/80 rounded-2xl p-4 text-left mb-5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B1D24] mb-1">
                  <Gift className="w-4 h-4" />
                  <span>학생증 제시 시 제휴 혜택</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{pickedStore.benefit}</p>
                {pickedStore.recommendedMenu && (
                  <p className="text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-red-200/60">
                    <span className="font-semibold text-slate-700">추천 메뉴:</span> {pickedStore.recommendedMenu}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={pickRandom}
                  disabled={isSpinning}
                  className="flex-1 py-3 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>다시 뽑기</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectStore(pickedStore);
                    onClose();
                  }}
                  className="flex-1 py-3 px-3 rounded-2xl bg-[#8B1D24] hover:bg-[#72171d] active:scale-95 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>지도에서 보기</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-6">선택 가능한 제휴 매장이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};
