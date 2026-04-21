import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  title?: string;
  placeholder?: string;
  enableSearch?: boolean;
  enableRecent?: boolean;
  recentStorageKey?: string;
  triggerClassName?: string;
  triggerContent?: React.ReactNode;
}

export default function BottomSheetSelect({
  value,
  onChange,
  options,
  title = 'Pilih Opsi',
  placeholder = 'Pilih...',
  enableSearch = false,
  enableRecent = false,
  recentStorageKey = 'recent_selections',
  triggerClassName,
  triggerContent,
}: BottomSheetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState<string[]>([]);
  
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enableRecent && recentStorageKey) {
      const stored = localStorage.getItem(recentStorageKey);
      if (stored) {
        try {
          setRecentItems(JSON.parse(stored));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [enableRecent, recentStorageKey]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setSearchQuery(''), 300);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelect = (opt: string) => {
    if (enableRecent && recentStorageKey) {
      // Create new recent list, ensuring opt is at the top, max 3 items
      const updatedRecents = [opt, ...recentItems.filter(item => item !== opt)].slice(0, 3);
      setRecentItems(updatedRecents);
      localStorage.setItem(recentStorageKey, JSON.stringify(updatedRecents));
    }
    onChange(opt);
    setIsOpen(false);
  };

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayValue = value || placeholder;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName || "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-left flex items-center justify-between shadow-sm focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"}
      >
        {triggerContent ? triggerContent : (
          <>
            <span className={`block truncate text-[13px] font-semibold ${value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
              {displayValue}
            </span>
            <span className="material-symbols-outlined text-slate-400 transition-transform duration-200">
              expand_more
            </span>
          </>
        )}
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Bottom Sheet */}
          <div 
            ref={sheetRef}
            className="relative bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300"
          >
            {/* Drag Handle Indicator */}
            <div className="flex justify-center pt-3 pb-2 w-full cursor-pointer" onClick={() => setIsOpen(false)}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-5 pb-3 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-manrope font-bold text-[16px] text-slate-800 dark:text-slate-100">
                {title}
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Search Bar */}
            {enableSearch && (
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari opsi..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-200 dark:bg-slate-700 w-5 h-5 rounded-full flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 scroll-smooth">
              {/* Recently Used Section */}
              {enableRecent && !searchQuery && recentItems.length > 0 && (
                <div className="mb-3">
                  <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sering Digunakan</p>
                  {recentItems.map(item => (
                    <button
                      key={`recent-${item}`}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-3.5 text-[13px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-xl transition-colors flex items-center gap-3 mb-1 border border-teal-100 dark:border-teal-900/50"
                    >
                      <span className="material-symbols-outlined text-[18px]">history</span>
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                  <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-2 mx-2" />
                </div>
              )}

              {/* All Options Section */}
              {enableRecent && !searchQuery && (
                <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semua Opsi</p>
              )}
              
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-10 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-700 mb-2">search_off</span>
                  <p className="text-slate-500 text-[13px] font-medium">Tidak ada hasil ditemukan.</p>
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = value === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left px-3 py-3.5 my-0.5 rounded-xl text-[13px] transition-colors flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 font-bold' 
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      {isSelected ? (
                        <span className="material-symbols-outlined text-[20px] text-teal-600 dark:text-teal-400">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-slate-300 dark:text-slate-700">radio_button_unchecked</span>
                      )}
                      <span className="truncate flex-1">{opt}</span>
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Bottom Padding for Mobile Home Indicator */}
            <div className="pb-6"></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
