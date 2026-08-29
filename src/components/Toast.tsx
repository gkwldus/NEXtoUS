import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-gray-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-white/10">
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
        <span>{toast.text}</span>
      </div>
    </div>
  );
};
