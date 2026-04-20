import React, { useState } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';

export default function KalenderAkademik() {
  const showToast = useAppStore(state => state.showToast);
  const kalender = useLiveQuery(() => db.kalender.orderBy('tanggal').toArray().then(arr => arr.filter(k => !k.isDeleted)));

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'masuk' | 'libur' | 'kegiatan'>('libur');
  const [keterangan, setKeterangan] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan) return;
    
    // Cek apakah tanggal sudah ada
    const existing = await db.kalender.where('tanggal').equals(tanggal).first();
    if (existing && existing.id) {
      await db.kalender.update(existing.id, { status, keterangan, updatedAt: Date.now() });
      showToast("Kalender diperbarui", "success");
    } else {
      await db.kalender.add({ tanggal, status, keterangan, updatedAt: Date.now() });
      showToast("Ditambahkan ke kalender", "success");
    }
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

        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal</label>
            <input 
              type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
              <select 
                value={status} onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none"
              >
                <option value="libur">Libur Nasional</option>
                <option value="kegiatan">Kegiatan Khusus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Keterangan</label>
              <input 
                type="text" value={keterangan} onChange={e => setKeterangan(e.target.value)} required placeholder="Misal: Cuti Bersama"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3.5 rounded-xl hover:bg-cyan-700 active:scale-95 transition-all shadow-lg shadow-cyan-900/20 mt-2">
            Simpan ke Kalender
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Daftar Hari Libur & Kegiatan</h2>
          {kalender?.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Belum ada data kalender.</p>}
          {kalender?.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.status === 'libur' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/20'}`}>
                  <span className="material-symbols-outlined">{item.status === 'libur' ? 'event_busy' : 'event_available'}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.keterangan}</h4>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{formatterTanggal.format(new Date(item.tanggal))}</p>
                </div>
              </div>
              <button onClick={() => item.id && setDeleteTarget({ id: item.id, name: item.keterangan })} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
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
    </>
  );
}
