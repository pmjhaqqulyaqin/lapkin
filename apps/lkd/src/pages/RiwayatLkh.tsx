import React, { useState } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import BottomSheetSelect from '../components/BottomSheetSelect';
import SyncActionBadge from '../components/SyncActionBadge';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YEARS = ['2025', '2026', '2027'];

export default function RiwayatLkh() {
  const { activeMonthIndex, activeYear, setActiveMonthYear, showToast } = useAppStore();

  // Modal Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editKegiatan, setEditKegiatan] = useState('');
  const [editUraian, setEditUraian] = useState('');

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleEditOpen = (item: any) => {
    setEditId(item.id);
    setEditKegiatan(item.kegiatan);
    setEditUraian(item.uraian);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await db.lkh.update(editId, {
        kegiatan: editKegiatan,
        uraian: editUraian,
        updatedAt: Date.now(),
      });
      showToast("Aktivitas berhasil diperbarui!", "success");
      setIsEditModalOpen(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await db.lkh.update(deleteTarget.id, { isDeleted: true, updatedAt: Date.now() });
      showToast("Aktivitas berhasil dihapus", "success");
      setDeleteTarget(null);
    }
  };

  // Ambil semua LKH
  const semuaLkh = useLiveQuery(() => db.lkh.orderBy('tanggal').reverse().toArray().then(arr => arr.filter(l => !l.isDeleted)));

  // Filter LKH berdasarkan bulan dan tahun terpilih
  const lkhFiltered = semuaLkh?.filter((l) => {
    const d = new Date(l.tanggal);
    return d.getMonth() === activeMonthIndex && d.getFullYear() === activeYear;
  });

  const formatterBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  const namaBulanTahunIni = `${formatterBulan.format(new Date(activeYear, activeMonthIndex))} ${activeYear}`;

  return (
    <>
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center w-full px-4 py-3 mx-auto sticky top-0 z-50 shadow-sm shadow-teal-900/5">
        <div className="flex items-center gap-2.5">
          <NavLink to="/dashboard" className="text-teal-950 dark:text-teal-50 bg-teal-900/5 p-1.5 rounded-full active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </NavLink>
          <div>
            <h1 className="font-manrope font-bold text-[15px] tracking-tight text-teal-950 dark:text-teal-50">
              Riwayat LHK
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">Kelola dan Filter Laporan</p>
          </div>
        </div>
        <SyncActionBadge />
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        {/* Month & Year Filter */}
        <section className="mb-5">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <BottomSheetSelect 
                value={MONTHS[activeMonthIndex]}
                onChange={(val) => setActiveMonthYear(MONTHS.indexOf(val), activeYear)}
                options={MONTHS}
                title="Pilih Bulan"
              />
            </div>
            <div className="w-28">
              <BottomSheetSelect 
                value={activeYear.toString()}
                onChange={(val) => setActiveMonthYear(activeMonthIndex, Number(val))}
                options={YEARS}
                title="Pilih Tahun"
              />
            </div>
          </div>
        </section>

        {/* List of LKH */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100">Daftar Laporan</h2>
            <span className="text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 px-3 py-1 rounded-full">
              {lkhFiltered?.length || 0} Aktivitas
            </span>
          </div>

          <div className="space-y-3">
            {lkhFiltered && lkhFiltered.length > 0 ? (
              lkhFiltered.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' })}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.tipeSumber === 'jadwal' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : item.tipeSumber === 'kalender' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                        {item.tipeSumber}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditOpen(item)} className="text-slate-400 hover:text-teal-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => item.id && setDeleteTarget({ id: item.id, name: item.kegiatan })} className="text-slate-400 hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[13px] text-slate-800 dark:text-slate-100 mb-1">{item.kegiatan}</h3>
                  <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">{item.uraian}</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <span className="material-symbols-outlined text-[12px]">file_copy</span>
                    {item.keteranganOutput}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">inbox</span>
                <p>Tidak ada laporan ditemukan pada {namaBulanTahunIni}.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100">Edit Aktivitas</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors flex items-center justify-center w-6 h-6">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-3 space-y-2.5 bg-white dark:bg-slate-900">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kegiatan</label>
                <input 
                  type="text" 
                  value={editKegiatan} 
                  onChange={e => setEditKegiatan(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 font-semibold text-[12px] focus:ring-2 focus:ring-teal-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Uraian / Deskripsi</label>
                <textarea 
                  value={editUraian} 
                  onChange={e => setEditUraian(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] focus:ring-2 focus:ring-teal-500/50 outline-none resize-none"
                  required
                ></textarea>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="w-full bg-teal-800 text-white font-bold text-[12px] py-2 rounded-lg hover:bg-teal-900 active:scale-95 transition-all shadow-lg shadow-teal-900/20">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Aktivitas?"
        message="Aktivitas LKH ini akan dihapus secara permanen dari riwayat Anda."
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
