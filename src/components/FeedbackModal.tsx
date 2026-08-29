import React, { useState } from 'react';
import { X, Send, HeartHandshake } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (text: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmitFeedback,
}) => {
  const [feedbackText, setFeedbackText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = feedbackText.trim();
    if (!text) {
      alert('희망하시는 매장명을 입력해 주세요!');
      return;
    }
    onSubmitFeedback(text);
    setFeedbackText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B1D24] via-[#962028] to-[#7B191F] text-white px-4 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-300" />
            <h4 className="font-bold text-sm tracking-tight">💌 제휴 희망 매장 건의</h4>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5 bg-slate-50">
          <p className="text-xs text-slate-600 leading-relaxed">
            경희대와 제휴를 맺었으면 하는 식당, 카페, 문화시설 등을 자유롭게 남겨주세요!
          </p>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="예: 정문 앞 OO파스타 제휴 맺어주세요! 학생 할인 10%나 음료 제공 희망합니다."
            rows={4}
            className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D24]/20 focus:border-[#8B1D24] resize-none text-slate-800 placeholder-slate-400 font-medium leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">총학생회 제휴국 전달</span>
            <button
              type="submit"
              className="bg-[#8B1D24] hover:bg-[#72171d] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>제휴 건의 등록하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
