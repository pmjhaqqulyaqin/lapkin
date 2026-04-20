import { useState, useEffect } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface Props {
  title: string;
  items: string[];
  onSave: (newItems: string[]) => void;
  onClose: () => void;
}

export default function CategoryManagerModal({ title, items: initialItems, onSave, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [items, setItems] = useState<string[]>(initialItems);
  const [newItem, setNewItem] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; name: string } | null>(null);

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveConfirm = () => {
    if (deleteTarget !== null) {
      const newArr = [...items];
      newArr.splice(deleteTarget.index, 1);
      setItems(newArr);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm pt-10 pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800 flex flex-col max-h-full">
        
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="font-manrope font-bold text-[14px] text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-teal-600">list_alt</span>
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto min-h-0 space-y-3">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newItem} 
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Tambah baru..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
            />
            <button 
              onClick={handleAdd}
              disabled={!newItem.trim()}
              className="bg-teal-700 text-white rounded-xl px-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>

          <div className="space-y-1.5 mt-3">
            {items.length === 0 ? (
              <p className="text-center text-[12px] text-slate-400 py-3 italic">Belum ada data.</p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{item}</span>
                  <button onClick={() => setDeleteTarget({ index, name: item })} className="text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            onClick={() => { onSave(items); onClose(); }} 
            className="w-full bg-teal-800 text-white font-bold text-[13px] py-2.5 rounded-xl hover:bg-teal-900 active:scale-95 transition-all shadow-lg shadow-teal-900/20"
          >
            Simpan Perubahan
          </button>
        </div>

      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Opsi?"
        message="Opsi ini akan dihapus dari daftar."
        itemName={deleteTarget?.name}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
