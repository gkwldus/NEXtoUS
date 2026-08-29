import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, RotateCcw, Sparkles, Key, Bot, ChevronDown, ChevronUp, MapPin, ExternalLink, Gift } from 'lucide-react';
import { AffiliateStore } from '../types';
import { AFFILIATE_STORES } from '../data/stores';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedStores?: AffiliateStore[];
}

interface ChatbotModalProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectStore: (store: AffiliateStore) => void;
}

const QUICK_PROMPTS = [
  '🍕 4인 양식/피자 모임 추천해줘',
  '☕ 조용하고 분위기 좋은 카페',
  '🍖 동아리 단체 회식하기 좋은 고깃집',
  '🍱 가성비 좋은 정문 앞 밥집',
  '🍜 비 오는 날 국물/라멘 맛집'
];

export function ChatbotModal({ isOpen, onToggle, onSelectStore }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `안녕! 나는 경희대 국제캠퍼스 전용 **제휴봇**이야. ✨\n\n인원수나 메뉴, 원하는 분위기(예: *"4명 점심 가성비 좋은 곳", "분위기 좋은 카페"*)를 말해주면 딱 맞는 제휴처를 찾아줄게!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('khu_user_gemini_key') || '';
  });
  const [showKeyBanner, setShowKeyBanner] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('khu_user_gemini_key', key);
  };

  // Local fallback recommendation generator
  const generateLocalReply = useCallback((query: string): string => {
    const q = query.toLowerCase();
    let matched: AffiliateStore[] = [];

    if (q.includes('양식') || q.includes('파스타') || q.includes('피자') || q.includes('스테이크')) {
      matched = AFFILIATE_STORES.filter(
        (s) => s.category.includes('양식') || s.tags.includes('양식') || s.name.includes('그로또') || s.name.includes('존앤진') || s.name.includes('뜨돈')
      );
    } else if (q.includes('고기') || q.includes('삼겹살') || q.includes('회식') || q.includes('갈비') || q.includes('단체')) {
      matched = AFFILIATE_STORES.filter(
        (s) => s.category.includes('고기') || s.category.includes('구이') || s.category.includes('뷔페') || s.name.includes('돼통령') || s.name.includes('명륜진사갈비')
      );
    } else if (q.includes('카페') || q.includes('디저트') || q.includes('커피') || q.includes('카공') || q.includes('빙수')) {
      matched = AFFILIATE_STORES.filter((s) => s.type === 'cafe');
    } else if (q.includes('일식') || q.includes('라멘') || q.includes('덮밥') || q.includes('돈가스')) {
      matched = AFFILIATE_STORES.filter((s) => s.category.includes('일식') || s.name.includes('키와마루아지') || s.name.includes('핵밥'));
    } else if (q.includes('한식') || q.includes('국수') || q.includes('닭갈비') || q.includes('부대찌개') || q.includes('혼밥')) {
      matched = AFFILIATE_STORES.filter(
        (s) => s.category.includes('한식') || s.name.includes('오늘국수') || s.name.includes('오늘도 닭갈비') || s.name.includes('메가혼밥')
      );
    } else if (q.includes('정문') || q.includes('가까운') || q.includes('서천')) {
      matched = AFFILIATE_STORES.filter((s) => s.area === 'campus');
    } else if (q.includes('영통') || q.includes('역')) {
      matched = AFFILIATE_STORES.filter((s) => s.area === 'yeongtong');
    } else {
      matched = AFFILIATE_STORES.slice(0, 4);
    }

    if (matched.length === 0) {
      matched = AFFILIATE_STORES.slice(0, 3);
    }

    const selected = matched.slice(0, 3);
    let reply = `💡 **휴쿠봇의 맞춤 추천:**\n\n`;

    selected.forEach((s, idx) => {
      reply += `${idx + 1}. **${s.name}** (${s.category} · ${s.areaName})\n`;
      reply += `   • 🎁 **제휴 혜택:** ${s.benefit}\n`;
      if (s.recommendedMenu) {
        reply += `   • 🍽️ **추천 메뉴:** ${s.recommendedMenu}\n`;
      }
      reply += `\n`;
    });

    reply += `✨ 상단의 파란색 매장 태그를 누르면 지도로 바로 이동해! 결제 시 학생증 챙기는 거 잊지 마! 🎓`;
    return reply;
  }, []);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputQuery('');
    setIsLoading(true);

    try {
      // 1. First try server-side full-stack Gemini API endpoint
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          apiKey: apiKey.trim() || undefined,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsLoading(false);
          return;
        }
      }

      // If custom API Key exists but server was unavailable, try direct Google AI Studio endpoint
      if (apiKey.trim()) {
        const directEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey.trim()}`;
        const storeBrief = AFFILIATE_STORES.map((s) => `${s.name} (${s.category}, ${s.areaName}, 혜택: ${s.benefit}, 추천메뉴: ${s.recommendedMenu || '없음'})`).join('\n');
        
        const systemPrompt = `너는 경희대학교 국제캠퍼스 제휴 혜택 전문 AI '휴쿠봇'이야.
반드시 아래 [경희대 제휴 DB]에 존재하는 매장만 추천해줘.
매장명을 추천할 때 매장명을 정확히 써줘 (예: 존앤진피자펍 행궁본점, 그로또 등).
학생증 혜택과 메뉴를 친절하게 안내해줘.
[경희대 제휴 DB]:
${storeBrief}`;

        const directRes = await fetch(directEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n사용자 질문: ${trimmed}` }]
              }
            ]
          })
        });

        if (directRes.ok) {
          const directData = await directRes.json();
          const replyText = directData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            const botMsg: Message = {
              id: (Date.now() + 1).toString(),
              sender: 'bot',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Fallback to Local Intelligent Matching
      const fallbackReply = generateLocalReply(trimmed);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Chat error, using fallback:', err);
      const fallbackReply = generateLocalReply(trimmed);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: `대화가 초기화되었어! 궁금한 제휴 혜택이나 상황(예: "정문 근처 조용한 카페", "영통역 회식 장소")을 알려줘! ✨`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to render text with interactive clickable store tags
  const renderMessageContent = (text: string) => {
    // Break into lines
    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 text-[13px] leading-relaxed">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-1" />;

          // Check if line contains any affiliate store name
          const elements: React.ReactNode[] = [];
          let remaining = line;
          let keyCounter = 0;

          // Replace bold formatting **text**
          // and highlight store names
          const storeMatches = AFFILIATE_STORES.filter((s) => remaining.includes(s.name));

          if (storeMatches.length > 0) {
            // Sort store names by length descending to match longest first
            storeMatches.sort((a, b) => b.name.length - a.name.length);

            let lastIndex = 0;
            const regex = new RegExp(`(${storeMatches.map((s) => s.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
            let match: RegExpExecArray | null;

            while ((match = regex.exec(line)) !== null) {
              const beforeText = line.substring(lastIndex, match.index);
              if (beforeText) {
                elements.push(<span key={`text-${lIdx}-${keyCounter++}`}>{formatMarkdownBold(beforeText)}</span>);
              }

              const matchedName = match[0];
              const targetStore = AFFILIATE_STORES.find((s) => s.name === matchedName);

              if (targetStore) {
                elements.push(
                  <button
                    key={`store-${lIdx}-${keyCounter++}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStore(targetStore);
                    }}
                    className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-lg bg-red-50 text-[#8B1D24] font-bold border border-red-200/80 hover:bg-[#8B1D24] hover:text-white transition cursor-pointer text-xs align-baseline shadow-2xs group"
                    title={`${targetStore.name} 지도 위치로 이동`}
                  >
                    <MapPin className="w-3 h-3 text-[#8B1D24] group-hover:text-white transition shrink-0" />
                    <span>{targetStore.name}</span>
                  </button>
                );
              } else {
                elements.push(<span key={`text-${lIdx}-${keyCounter++}`}>{matchedName}</span>);
              }

              lastIndex = regex.lastIndex;
            }

            if (lastIndex < line.length) {
              elements.push(<span key={`text-${lIdx}-${keyCounter++}`}>{formatMarkdownBold(line.substring(lastIndex))}</span>);
            }

            return <p key={lIdx}>{elements}</p>;
          }

          return <p key={lIdx}>{formatMarkdownBold(line)}</p>;
        })}
      </div>
    );
  };

  // Helper to format **bold** markdown tags
  const formatMarkdownBold = (raw: string) => {
    const parts = raw.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-[1010] flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200 text-xs font-semibold text-slate-700 animate-bounce">
            <span className="text-[#8B1D24] font-bold">🤖 제휴봇</span>
            <span className="text-slate-400">|</span>
            <span>경희대 제휴 AI</span>
          </div>
        )}

        <button
          id="btn-chatbot-fab"
          type="button"
          onClick={() => {
            onToggle();
            setHasNewMessage(false);
          }}
          className={`w-[62px] h-[62px] rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 border-2 border-white/40 ${
            isOpen
              ? 'bg-slate-900 text-white rotate-90 scale-95'
              : 'bg-[#8B1D24] text-white hover:scale-105 shadow-[#8B1D24]/40 hover:shadow-[#8B1D24]/60'
          }`}
          aria-label="제휴봇 AI 챗봇 열기"
          title="제휴봇 (경희대 AI) 열기"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <span className="text-3xl">🤖</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white animate-pulse"></span>
            </div>
          )}
        </button>
      </div>

      {/* Chatbot Modal Window */}
      {isOpen && (
        <div
          id="chatbot-modal"
          className="fixed inset-x-3 bottom-24 sm:inset-x-auto sm:right-6 sm:bottom-24 w-auto sm:w-[380px] max-h-[82vh] h-[540px] bg-white rounded-3xl shadow-2xl z-[1010] flex flex-col border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-[#8B1D24] text-white p-3.5 px-4 flex items-center justify-between shadow-md border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-lg shadow-inner">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight text-white leading-none">제휴봇 (경희대 AI)</h3>
                  <span className="bg-amber-400 text-slate-900 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full">
                    KHU AI
                  </span>
                </div>
                <p className="text-[11px] text-red-100/90 font-normal mt-0.5">상황·인원별 맞춤 제휴 매장 추천</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKeyBanner((prev) => !prev)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-red-100 hover:text-white transition"
                title="API 키 설정"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-red-100 hover:text-white transition"
                title="대화 초기화"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition ml-0.5"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Custom API Key Setting Accordion */}
          {showKeyBanner && (
            <div className="bg-red-50/90 border-b border-red-200/80 p-2.5 px-3.5 text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[#8B1D24] flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>Google AI Studio Key (선택)</span>
                </span>
                <span className="text-[10px] text-slate-500">기본 서버 API 자동 지원</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder="개인 Gemini API 키 (미입력 시 기본 AI 엔진)"
                  className="flex-1 bg-white border border-red-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-[#8B1D24] text-slate-800"
                />
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => handleSaveApiKey('')}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Prompts Carousel */}
          <div className="bg-slate-50/90 border-b border-slate-200/80 p-2 px-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">추천 질문:</span>
            {QUICK_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="shrink-0 text-[11px] font-semibold bg-white hover:bg-red-50 text-slate-700 hover:text-[#8B1D24] border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-full transition shadow-2xs active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-1.5 max-w-[88%]">
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-[#8B1D24] text-white flex items-center justify-center text-xs shrink-0 mb-1 shadow-xs">
                      🤖
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-[#8B1D24] to-[#7B191F] text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      renderMessageContent(msg.text)
                    )}
                  </div>
                </div>

                <span className="text-[9.5px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-1.5 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-[#8B1D24] text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  🤖
                </div>
                <div className="bg-white border border-slate-200/80 p-3 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8B1D24] animate-spin" />
                  <span className="text-xs text-slate-600 font-medium">제휴 목록을 분석하며 답변 중...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2.5 px-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="예: 4명 양식 추천해줘, 조용한 카페"
              className="flex-1 bg-slate-100/80 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs outline-none focus:bg-white focus:border-[#8B1D24] focus:ring-1 focus:ring-[#8B1D24] text-slate-800 transition placeholder-slate-400"
            />

            <button
              id="btn-chat-send"
              type="button"
              onClick={() => handleSend()}
              disabled={!inputQuery.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-[#8B1D24] hover:bg-[#72171d] disabled:opacity-40 active:scale-95 text-white flex items-center justify-center transition shadow-xs shrink-0"
              aria-label="전송"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
