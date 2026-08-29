import React, { useState, useEffect, useRef } from 'react';
import { X, Dices, MapPin, Sparkles, RefreshCw, Play } from 'lucide-react';
import { AffiliateStore } from '../types';

interface LadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: AffiliateStore[];
  onSelectStore: (store: AffiliateStore) => void;
}

interface LadderLine {
  col: number; // 0, 1, 2 (connects col and col+1)
  yRatio: number; // 0.15 to 0.85
}

export const LadderModal: React.FC<LadderModalProps> = ({
  isOpen,
  onClose,
  stores,
  onSelectStore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [candidates, setCandidates] = useState<AffiliateStore[]>([]);
  const [horizontalLines, setHorizontalLines] = useState<LadderLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [winnerStore, setWinnerStore] = useState<AffiliateStore | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize 4 candidates and ladder rungs
  const resetLadder = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    const foodStores = stores.filter((s) => s.type === 'food' || s.type === 'cafe');
    const shuffled = [...foodStores].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    setCandidates(selected);
    setSelectedColumn(null);
    setWinnerStore(null);
    setIsPlaying(false);

    // Generate random horizontal lines
    const lines: LadderLine[] = [];
    // Ensure 2-3 rungs per column gap
    for (let c = 0; c < 3; c++) {
      const numLines = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numLines; i++) {
        lines.push({
          col: c,
          yRatio: 0.18 + Math.random() * 0.65
        });
      }
    }
    // Sort lines by y
    lines.sort((a, b) => a.yRatio - b.yRatio);
    setHorizontalLines(lines);
  };

  useEffect(() => {
    if (isOpen) {
      resetLadder();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isOpen, stores]);

  // Render static ladder
  const drawStaticLadder = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const startY = 35;
    const endY = height - 35;
    const colSpacing = width / 4;

    // Draw vertical lines
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (let i = 0; i < 4; i++) {
      const x = colSpacing * i + colSpacing / 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal rungs
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    horizontalLines.forEach((line) => {
      const x1 = colSpacing * line.col + colSpacing / 2;
      const x2 = colSpacing * (line.col + 1) + colSpacing / 2;
      const y = startY + (endY - startY) * line.yRatio;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    });
  };

  // Draw initial canvas when not animating
  useEffect(() => {
    if (!isOpen || !canvasRef.current || isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawStaticLadder(ctx, canvas.width, canvas.height);
  }, [isOpen, horizontalLines, isPlaying]);

  // Run ladder animation for selected starting column
  const startLadderFrom = (startCol: number) => {
    if (isPlaying || !canvasRef.current) return;
    setIsPlaying(true);
    setSelectedColumn(startCol);
    setWinnerStore(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const startY = 35;
    const endY = height - 35;
    const colSpacing = width / 4;

    // Compute route waypoints
    let currentCol = startCol;
    let currentY = startY;
    const path: { x: number; y: number }[] = [{ x: colSpacing * currentCol + colSpacing / 2, y: currentY }];

    // Find rungs sequentially as Y increases
    const sortedRungs = [...horizontalLines].sort((a, b) => a.yRatio - b.yRatio);

    sortedRungs.forEach((rung) => {
      const rungY = startY + (endY - startY) * rung.yRatio;
      if (rungY > currentY) {
        if (rung.col === currentCol) {
          // Move down to rung
          path.push({ x: colSpacing * currentCol + colSpacing / 2, y: rungY });
          // Move right
          currentCol = currentCol + 1;
          path.push({ x: colSpacing * currentCol + colSpacing / 2, y: rungY });
          currentY = rungY;
        } else if (rung.col === currentCol - 1) {
          // Move down to rung
          path.push({ x: colSpacing * currentCol + colSpacing / 2, y: rungY });
          // Move left
          currentCol = currentCol - 1;
          path.push({ x: colSpacing * currentCol + colSpacing / 2, y: rungY });
          currentY = rungY;
        }
      }
    });

    // Final point at bottom
    path.push({ x: colSpacing * currentCol + colSpacing / 2, y: endY });
    const finalWinningIndex = currentCol;

    // Animate point along path
    let segmentIndex = 0;
    let segmentProgress = 0;
    const speed = 0.08; // speed per frame

    const completedSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

    const animate = () => {
      if (segmentIndex >= path.length - 1) {
        // Animation finished
        setIsPlaying(false);
        if (candidates[finalWinningIndex]) {
          setWinnerStore(candidates[finalWinningIndex]);
        }
        return;
      }

      segmentProgress += speed;
      const p1 = path[segmentIndex];
      const p2 = path[segmentIndex + 1];

      if (segmentProgress >= 1) {
        completedSegments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
        segmentIndex++;
        segmentProgress = 0;
      }

      // Draw ladder
      drawStaticLadder(ctx, width, height);

      // Draw completed path in vivid crimson
      ctx.strokeStyle = '#8B1D24';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      completedSegments.forEach((seg) => {
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      });

      // Draw current moving segment
      if (segmentIndex < path.length - 1) {
        const curP1 = path[segmentIndex];
        const curP2 = path[segmentIndex + 1];
        const curX = curP1.x + (curP2.x - curP1.x) * segmentProgress;
        const curY = curP1.y + (curP2.y - curP1.y) * segmentProgress;

        ctx.beginPath();
        ctx.moveTo(curP1.x, curP1.y);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // Draw animated head glow
        ctx.fillStyle = '#fee500';
        ctx.beginPath();
        ctx.arc(curX, curY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B1D24';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-[390px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#8B1D24] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-amber-300" />
            <h4 className="font-extrabold text-sm tracking-tight">오늘 뭐 먹지? (사다리 게임)</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Canvas Container */}
        <div className="p-4 bg-slate-50 flex flex-col items-center">
          <p className="text-xs text-slate-600 mb-2 font-medium">
            출발 번호를 누르거나 아래 버튼으로 사다리를 타보세요!
          </p>

          {/* Top start buttons */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-[320px] mb-1">
            {[0, 1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isPlaying}
                onClick={() => startLadderFrom(num)}
                className={`py-1.5 rounded-xl font-black text-xs transition shadow-xs border cursor-pointer ${
                  selectedColumn === num
                    ? 'bg-[#8B1D24] text-white border-[#8B1D24] scale-105'
                    : 'bg-white text-slate-700 hover:bg-red-50 border-slate-300 hover:border-[#8B1D24]'
                } disabled:opacity-60`}
              >
                출발 {num + 1}
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div className="relative bg-white rounded-2xl p-1 border border-slate-200 shadow-inner my-1.5">
            <canvas
              ref={canvasRef}
              width={320}
              height={200}
              className="block rounded-xl"
            />
          </div>

          {/* Bottom candidate names */}
          <div className="grid grid-cols-4 gap-1 w-full max-w-[320px] mb-3">
            {candidates.map((cand, idx) => {
              const isWinner = winnerStore?.id === cand.id;
              return (
                <div
                  key={cand.id + idx}
                  className={`p-1.5 rounded-xl text-[10.5px] font-bold text-center leading-tight transition-all border ${
                    isWinner
                      ? 'bg-red-100 text-[#8B1D24] border-[#8B1D24] ring-2 ring-[#8B1D24]/30 scale-105 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <p className="line-clamp-2 truncate">{cand.name}</p>
                </div>
              );
            })}
          </div>

          {/* Winner Result Box */}
          {winnerStore && (
            <div className="w-full bg-[#fff8f8] border-2 border-dashed border-[#8B1D24] rounded-2xl p-3.5 mb-3 flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full mb-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>오늘의 당첨 메뉴</span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {winnerStore.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {winnerStore.category} · {winnerStore.areaName}
              </p>
              <p className="text-xs font-bold text-[#8B1D24] bg-white py-1 px-2.5 rounded-lg border border-red-100 mt-1.5 shadow-xs">
                🎁 {winnerStore.benefit.split('\n')[0]}
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectStore(winnerStore);
                  onClose();
                }}
                className="mt-2.5 w-full py-2 bg-[#8B1D24] hover:bg-[#72171d] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>지도에서 위치 확인하기 📍</span>
              </button>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="flex gap-2 w-full">
            <button
              type="button"
              disabled={isPlaying}
              onClick={() => {
                const randomCol = Math.floor(Math.random() * 4);
                startLadderFrom(randomCol);
              }}
              className="flex-1 bg-[#8B1D24] hover:bg-[#72171d] active:scale-95 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>랜덤 사다리 타기 🎯</span>
            </button>
            <button
              type="button"
              disabled={isPlaying}
              onClick={resetLadder}
              className="bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-300 py-2.5 px-3 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
              title="새로운 후보로 섞기"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

