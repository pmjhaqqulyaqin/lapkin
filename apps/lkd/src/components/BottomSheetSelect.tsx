import React, { useState, useEffect, useRef } from 'react';

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
  
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen) {
      setTimeout(() => setSearchQuery(''), 200);
    }
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClassName || "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-left flex items-center justify-between shadow-sm focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"}
      >
        {triggerContent ? triggerContent : (
          <>
            <span className={`block truncate text-[13px] font-semibold ${value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
              {displayValue}
            </span>
            <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 text-[18px] ${isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Invisible overlay to close on outside click */}
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)}></div>

          {/* Dropdown Popover */}
          <div className="absolute left-0 right-0 top-full mt-1 z-[95] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/30 animate-scale-up overflow-hidden flex flex-col max-h-[40vh]">
            
            {/* Header */}
            <div className="px-3 py-2 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="font-manrope font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                {title}
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>

            {/* Search Bar */}
            {enableSearch && (
              <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari..."
                    autoFocus
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto px-1.5 py-1 scroll-smooth">
              {/* Recently Used Section */}
              {enableRecent && !searchQuery && recentItems.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Terakhir</p>
                  {recentItems.map(item => (
                    <button
                      key={`recent-${item}`}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-2 py-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                  <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-0.5 mx-2" />
                </div>
              )}

              {/* All Options Section */}
              {enableRecent && !searchQuery && (
                <p className="px-2 py-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Semua</p>
              )}
              
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-[24px] text-slate-300 dark:text-slate-700 mb-1">search_off</span>
                  <p className="text-slate-500 text-[10px] font-medium">Tidak ada hasil.</p>
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = value === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 font-bold' 
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      {isSelected ? (
                        <span className="material-symbols-outlined text-[14px] text-teal-600 dark:text-teal-400">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-700">radio_button_unchecked</span>
                      )}
                      <span className="truncate flex-1">{opt}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
