import React, { useState, useEffect } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CategoryManagerModal from '../components/CategoryManagerModal';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';

export default function KalenderAkademik() {
  const { showToast, statusKalender, setStatusKalender } = useAppStore();
  const kalender = useLiveQuery(() => db.kalender.orderBy('tanggal').toArray().then(arr => arr.filter(k => !k.isDeleted)));

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState(statusKalender[0] || 'Libur Nasional');
  const [keterangan, setKeterangan] = useState('');
  
  const [editId, setEditId] = useState<number | null>(null);
  const [isManageStatusOpen, setIsManageStatusOpen] = useState(false);

  // Sync status fallback if the list changes
  useEffect(() => {
    if (!statusKalender.includes(status) && statusKalender.length > 0) {
      setStatus(statusKalender[0]);
    }
  }, [statusKalender, status]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan) return;
    
    if (editId) {
      await db.kalender.update(editId, { tanggal, status, keterangan, updatedAt: Date.now() });
      showToast("Kalender diperbarui", "success");
      setEditId(null);
    } else {
      // Cek apakah tanggal sudah ada saat tambah baru
      const existing = await db.kalender.where('tanggal').equals(tanggal).first();
      if (existing && existing.id && !existing.isDeleted) {
        if (window.confirm("Sudah ada data di tanggal ini. Timpa?")) {
          await db.kalender.update(existing.id, { status, keterangan, updatedAt: Date.now() });
          showToast("Kalender diperbarui", "success");
        } else {
          return;
        }
      } else {
        await db.kalender.add({ tanggal, status, keterangan, updatedAt: Date.now() });
        showToast("Ditambahkan ke kalender", "success");
      }
    }
    setKeterangan('');
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setTanggal(item.tanggal);
    setStatus(item.status);
    setKeterangan(item.keterangan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditId(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    setStatus(statusKalender[0] || 'Libur Nasional');
    setKeterangan('');
  };

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await db.kalender.update(deleteTarget.id, { isDeleted: true, updatedAt: Date.now() });
      showToast("Dihapus dari kalender", "success");
      setDeleteTarget(null);
    }
  };

  const formatterTanggal = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md text-cyan-950 dark:text-cyan-50 font-manrope text-xl font-bold tracking-tight docked full-width top-0 sticky z-50 no-border shadow-sm shadow-cyan-900/5">
        <div className="flex justify-between items-center w-full px-4 py-4 mx-auto max-w-3xl">
          <NavLink to="/profil" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </NavLink>
          <h1>Kalender Akademik</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 pb-32">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl mb-8 flex gap-3 items-start">
          <span className="material-symbols-outlined text-amber-500 shrink-0">info</span>
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-500 text-sm">Pusat Sinkronisasi Kalender</h3>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
              Tambahkan hari libur nasional atau kegiatan khusus di sini. Jika ditandai sebagai 'Libur', Anda tidak perlu/bisa mengisi LKH pada tanggal tersebut.
            </p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 space-y-4 relative">
          {editId && (
            <div className="absolute top-0 left-0 right-0 bg-amber-100 text-amber-800 text-xs font-bold text-center py-1 rounded-t-3xl border-b border-amber-200">
              Mode Edit Aktif
            </div>
          )}
          <div className={editId ? "pt-4" : ""}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal</label>
            <input 
              type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Status</label>
                <button 
                  type="button" 
                  onClick={() => setIsManageStatusOpen(true)}
                  className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-1 rounded uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span> Kelola Opsi
                </button>
              </div>
              <div className="relative">
                <select 
                  value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none"
                >
                  {statusKalender.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Keterangan</label>
              <input 
                type="text" value={keterangan} onChange={e => setKeterangan(e.target.value)} required placeholder="Misal: Cuti Bersama"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {editId && (
              <button type="button" onClick={handleCancelEdit} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all">
                Batal
              </button>
            )}
            <button type="submit" className={`flex-[2] text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all shadow-lg ${editId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20' : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-900/20'}`}>
              {editId ? 'Simpan Perubahan' : 'Simpan ke Kalender'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Daftar Hari Libur & Kegiatan</h2>
          {kalender?.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Belum ada data kalender.</p>}
          {kalender?.map(item => {
            const isLiburIcon = item.status.toLowerCase().includes('libur') || item.status.toLowerCase().includes('cuti');
            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLiburIcon ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/20'}`}>
                    <span className="material-symbols-outlined">{isLiburIcon ? 'event_busy' : 'event_available'}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.keterangan}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-slate-500">{formatterTanggal.format(new Date(item.tanggal))}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isLiburIcon ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-cyan-600 transition-colors">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button onClick={() => item.id && setDeleteTarget({ id: item.id, name: item.keterangan })} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus dari Kalender?"
        message="Data kalender akademik ini akan dihapus secara permanen."
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      {isManageStatusOpen && (
        <CategoryManagerModal 
          title="Kelola Opsi Status"
          items={statusKalender}
          onSave={(newItems) => {
            setStatusKalender(newItems);
            if (!newItems.includes(status) && newItems.length > 0) {
              setStatus(newItems[0]);
            }
          }}
          onClose={() => setIsManageStatusOpen(false)}
        />
      )}
    </>
  );
}
