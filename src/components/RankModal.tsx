import React, { useMemo } from 'react';
import { X, Flame, Percent, MapPin, Sparkles } from 'lucide-react';
import { AffiliateStore } from '../types';

interface RankModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'popular' | 'discount';
  stores: AffiliateStore[];
  onSelectStore: (store: AffiliateStore) => void;
}

export const RankModal: React.FC<RankModalProps> = ({
  isOpen,
  onClose,
  mode,
  stores,
  onSelectStore,
}) => {
  const rankedList = useMemo(() => {
    if (!isOpen) return [];

    if (mode === 'popular') {
      // Popular ranking rule:
      // Cafe: 1등 카페칸나, 그외 무작위
      // Food: 1등 키와마루아지 경희대점, 2등 짜마차이나, 그외 무작위
      // Pubs & Lifes: 무작위
      const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

      const kanna = stores.find((s) => s.name === '카페칸나');
      const otherCafes = shuffle(stores.filter((s) => s.type === 'cafe' && s.name !== '카페칸나'));
      const cafeRank = kanna ? [kanna, ...otherCafes] : otherCafes;

      const kiwa = stores.find((s) => s.name === '키와마루아지 경희대점');
      const zzama = stores.find((s) => s.name === '짜마차이나');
      const otherFoods = shuffle(
        stores.filter(
          (s) =>
            s.type === 'food' &&
            s.name !== '키와마루아지 경희대점' &&
            s.name !== '짜마차이나'
        )
      );
      const foodRank = [kiwa, zzama, ...otherFoods].filter(Boolean) as AffiliateStore[];

      const otherPubs = shuffle(stores.filter((s) => s.type === 'pub'));
      const otherLifes = shuffle(stores.filter((s) => s.type === 'life'));

      return [
        ...foodRank.slice(0, 6),
        ...cafeRank.slice(0, 5),
        ...otherPubs.slice(0, 4),
        ...otherLifes.slice(0, 4),
      ];
    } else {
      // Discount Score ranking: sort descending by discountScore or benefit length
      return [...stores].sort((a, b) => {
        const scoreA = a.discountScore ?? 75;
        const scoreB = b.discountScore ?? 75;
        return scoreB - scoreA;
      });
    }
  }, [isOpen, mode, stores]);

  if (!isOpen) return null;

  const isPopular = mode === 'popular';

  return (
    <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md h-[560px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B1D24] via-[#962028] to-[#7B191F] text-white px-4 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            {isPopular ? (
              <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
            ) : (
              <Percent className="w-5 h-5 text-amber-300" />
            )}
            <h4 className="font-bold text-sm tracking-tight">
              {isPopular ? '🔥 경희대생 방문 인기순 매장' : '💸 최대 혜택 할인순 매장'}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Info */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/70 flex items-center justify-between text-xs text-amber-900 font-medium">
          <span>
            {isPopular
              ? '재학생 방문율 & 만족도 기반 베스트 제휴 매장'
              : '할인율 및 무료 제공 혜택 규모 순위'}
          </span>
          <span className="text-[11px] font-bold text-[#8B1D24]">총 {rankedList.length}곳</span>
        </div>

        {/* Store List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
          {rankedList.map((store, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={store.id || store.name}
                onClick={() => {
                  onSelectStore(store);
                  onClose();
                }}
                className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-xs border border-slate-200 hover:border-[#8B1D24] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer group"
              >
                {/* Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                    rank === 1
                      ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                      : rank === 2
                      ? 'bg-slate-300 text-slate-800'
                      : rank === 3
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 font-bold'
                  }`}
                >
                  {rank}
                </div>

                {/* Store Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-[#8B1D24] transition truncate">
                      {store.name}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {store.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#8B1D24] font-semibold mt-1 truncate">
                    🎁 {store.benefit.split('\n')[0]}
                  </p>

                  <div className="flex items-center gap-1 text-[10.5px] text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{store.addr || store.areaName}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-[#8B1D24] font-bold group-hover:underline">
                    지도 보기 📍
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
