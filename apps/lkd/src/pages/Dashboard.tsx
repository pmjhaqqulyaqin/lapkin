import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { activeMonthIndex, activeYear, setActiveMonthYear } = useAppStore();
  const profil = useLiveQuery(() => db.profil.get(1));
  
  const lkhBulanIni = useLiveQuery(
    () => db.lkh.orderBy('tanggal').reverse().toArray().then(arr => 
      arr.filter(l => {
        if (l.isDeleted) return false;
        const d = new Date(l.tanggal);
        return d.getMonth() === activeMonthIndex && d.getFullYear() === activeYear;
      })
    ), 
    [activeMonthIndex, activeYear]
  );

  // Hitung target hari efektif (tanpa hari minggu)
  const getWorkingDays = (month: number, year: number) => {
    let days = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() !== 0) days++; // 0 is Sunday
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const targetHari = getWorkingDays(activeMonthIndex, activeYear);
  const uniqueDates = new Set(lkhBulanIni?.map(l => l.tanggal));
  const hariTerisi = uniqueDates.size;
  const progressPercent = targetHari > 0 ? Math.min(100, Math.round((hariTerisi / targetHari) * 100)) : 0;

  const aktivitasTerakhir = lkhBulanIni?.slice(0, 3) || [];

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editKegiatan, setEditKegiatan] = useState('');
  const [editUraian, setEditUraian] = useState('');

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
      useAppStore.getState().showToast("Aktivitas berhasil diperbarui!", "success");
      setIsEditModalOpen(false);
    }
  };

  const handlePrevMonth = () => {
    if (activeMonthIndex === 0) {
      setActiveMonthYear(11, activeYear - 1);
    } else {
      setActiveMonthYear(activeMonthIndex - 1, activeYear);
    }
  };

  const handleNextMonth = () => {
    if (activeMonthIndex === 11) {
      setActiveMonthYear(0, activeYear + 1);
    } else {
      setActiveMonthYear(activeMonthIndex + 1, activeYear);
    }
  };

  const formatterBulan = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
  const displayBulan = formatterBulan.format(new Date(activeYear, activeMonthIndex));

  return (
    <>
      {/* TopAppBar */}
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-sm shadow-teal-900/5">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => useAppStore.getState().setSidebarOpen(true)} className="text-teal-950 dark:text-teal-50 scale-95 active:opacity-80 transition-all">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              {profil ? (
                <>
                  <h1 className="font-headline font-bold text-lg tracking-tight text-teal-950 dark:text-teal-50 leading-tight">{profil.nama}</h1>
                  <span className="text-xs text-on-surface-variant font-medium">{profil.jabatan || 'Guru'}</span>
                </>
              ) : (
                <>
                  <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1.5"></div>
                </>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-primary-fixed">
            <img
              alt="Teacher Profile Avatar"
              className="w-full h-full object-cover"
              src={profil?.avatarUrl || `https://ui-avatars.com/api/?name=${profil?.nama || 'Guru'}&background=0D9488&color=fff`}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 pb-32">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-8 bg-surface-container-lowest rounded-2xl p-2 shadow-sm border border-outline-variant/20">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-container transition-colors rounded-xl text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="font-headline font-bold text-lg text-primary">
            {displayBulan}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-surface-container transition-colors rounded-xl text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Status Card & Progress */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-primary-gradient p-6 rounded-2xl text-white shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="font-headline font-bold opacity-90">Status Hari Ini</h3>
                <span className="text-sm font-medium opacity-80 block mt-1">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' })}
                </span>
              </div>
              <div className="bg-secondary/20 text-secondary-fixed px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-secondary/30">
                <div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></div>
                Terhubung
              </div>
            </div>
            <div className="relative z-10 mt-6 flex items-end justify-between">
              <div>
                <span className="text-3xl font-headline font-black block">{lkhBulanIni?.length || 0}</span>
                <span className="text-xs uppercase tracking-widest opacity-80">Total Kegiatan</span>
              </div>
              <NavLink to="/lkh/input" className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
                <span className="material-symbols-outlined">add</span>
              </NavLink>
            </div>
            {/* Abstract Decorative */}
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-tl-full blur-2xl"></div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-headline font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">analytics</span>
                Progress LKH
              </h3>
              <span className="text-sm font-bold text-on-surface-variant">{progressPercent}%</span>
            </div>
            <div>
              <div className="w-full bg-surface-container-highest rounded-full h-3 mb-2 overflow-hidden">
                <div className="bg-tertiary h-3 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="flex justify-between text-xs font-medium text-on-surface-variant">
                <span>{hariTerisi} Hari Terisi</span>
                <span>Target: {targetHari} Hari Aktif</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activities */}
        <section className="mb-8">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="font-headline font-bold text-lg text-primary">Aktivitas Terakhir</h3>
            <NavLink to="/lkh/riwayat" className="text-sm font-bold text-secondary hover:underline">Lihat Semua</NavLink>
          </div>
          <div className="space-y-3">
            {aktivitasTerakhir.length > 0 ? (
              aktivitasTerakhir.map((item) => (
                <div key={item.id} onClick={() => handleEditOpen(item)} className="bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-xl flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.tipeSumber === 'jadwal' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                    <span className="material-symbols-outlined">{item.tipeSumber === 'jadwal' ? 'school' : 'task_alt'}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{item.kegiatan}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{item.tipeSumber}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-xs font-medium text-on-surface-variant">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                  <button className="text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-on-surface-variant border-2 border-dashed border-outline-variant/30 rounded-xl">
                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">inbox</span>
                <p className="text-sm">Belum ada aktivitas terekam.</p>
              </div>
            )}
          </div>
        </section>

        {/* Print Action */}
        <section>
          <NavLink to="/lkh/laporan" className="w-full py-4 bg-surface-container-highest text-primary border border-outline-variant/30 font-headline font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-outline-variant/20 transition-all active:scale-95">
            <span className="material-symbols-outlined">print</span>
            Cetak Laporan Bulan Ini
          </NavLink>
        </section>
      </main>

      {/* Edit Modal (Quick Action) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">edit_note</span>
                Koreksi Aktivitas
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-2 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 bg-white dark:bg-slate-900">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kegiatan</label>
                <input 
                  type="text" 
                  value={editKegiatan} 
                  onChange={e => setEditKegiatan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Uraian / Deskripsi</label>
                <textarea 
                  value={editUraian} 
                  onChange={e => setEditUraian(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/50 outline-none resize-none"
                  required
                ></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-teal-700 text-white font-bold py-3.5 rounded-xl hover:bg-teal-800 active:scale-95 transition-all shadow-lg shadow-teal-900/20">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
