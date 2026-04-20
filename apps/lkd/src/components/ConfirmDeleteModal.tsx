import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  title?: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal konfirmasi hapus bertahap (2-step).
 * Step 1: Tampilkan peringatan & tombol "Ya, Lanjutkan"
 * Step 2: Konfirmasi final dengan tombol "Hapus Permanen"
 */
export default function ConfirmDeleteModal({ isOpen, title = 'Konfirmasi Hapus', message, itemName, onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  // Reset step saat modal dibuka/ditutup
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    setStep(1);
    onCancel();
  };

  const handleFinalConfirm = () => {
    setStep(1);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={handleCancel}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[340px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Step 1: Peringatan Awal */}
        {step === 1 && (
          <>
            <div className="px-5 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-[28px]">warning</span>
              </div>
              <h3 className="font-manrope font-bold text-[16px] text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
              {itemName && (
                <div className="mt-3 bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 truncate">"{itemName}"</p>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all active:scale-95"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </>
        )}

        {/* Step 2: Konfirmasi Final */}
        {step === 2 && (
          <>
            <div className="px-5 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-white text-[28px]">delete_forever</span>
              </div>
              <h3 className="font-manrope font-bold text-[16px] text-red-700 dark:text-red-400 mb-2">Yakin Hapus?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini <span className="font-bold text-red-600 dark:text-red-400">tidak dapat dibatalkan</span>. Data yang dihapus tidak bisa dikembalikan.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleFinalConfirm}
                className="flex-1 py-3 rounded-xl font-bold text-[13px] bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/25 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                Hapus Permanen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
