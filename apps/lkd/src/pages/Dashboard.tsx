import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { activeMonthIndex, activeYear, setActiveMonthYear } = useAppStore();
  const profil = useLiveQuery(async () => {
    const p = await db.profil.get(1);
    if (p) return p;
    return db.profil.toCollection().first();
  });
  
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        <div className="flex justify-between items-center w-full px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => useAppStore.getState().setSidebarOpen(true)} className="text-teal-950 dark:text-teal-50 active:opacity-80 transition-all p-1">
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <div>
              {profil ? (
                <>
                  <h1 className="font-headline font-bold text-[15px] tracking-tight text-teal-950 dark:text-teal-50 leading-tight">{profil.nama}</h1>
                  <span className="text-[11px] text-on-surface-variant font-medium">{profil.jabatan || 'Guru'}</span>
                </>
              ) : (
                <>
                  <h1 className="font-headline font-bold text-[15px] tracking-tight text-teal-950 dark:text-teal-50 leading-tight">Laporan Kinerja Harian</h1>
                  <span className="text-[11px] text-on-surface-variant font-medium">MAN 2 Lombok Timur</span>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setIsProfileOpen(true)} className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-primary-fixed active:scale-95 transition-transform relative z-10 shrink-0">
            <img
              alt="Profil"
              className="w-full h-full object-cover pointer-events-none"
              src={profil?.avatarUrl || `https://ui-avatars.com/api/?name=${profil?.nama || 'G'}&background=0D9488&color=fff&size=64`}
            />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 pb-28">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-5 bg-surface-container-lowest rounded-xl p-1.5 shadow-sm border border-outline-variant/20">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-surface-container transition-colors rounded-lg text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-headline font-bold text-[15px] text-primary">
            {displayBulan}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 hover:bg-surface-container transition-colors rounded-lg text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Status Card & Progress */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <div className="bg-primary-gradient p-4 rounded-2xl text-white shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="font-headline font-bold text-[13px] opacity-90">Status Hari Ini</h3>
                <span className="text-[12px] font-medium opacity-80 block mt-0.5">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' })}
                </span>
              </div>
              <div className="bg-secondary/20 text-secondary-fixed px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-secondary/30">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></div>
                Terhubung
              </div>
            </div>
            <div className="relative z-10 mt-4 flex items-end justify-between">
              <div>
                <span className="text-2xl font-headline font-black block">{lkhBulanIni?.length || 0}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-80">Total Kegiatan</span>
              </div>
              <NavLink to="/lkh/input" className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
                <span className="material-symbols-outlined text-[20px]">add</span>
              </NavLink>
            </div>
            {/* Abstract Decorative */}
            <div className="absolute right-0 bottom-0 w-28 h-28 bg-white/5 rounded-tl-full blur-2xl"></div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-headline font-bold text-[13px] text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-tertiary">analytics</span>
                Progress LKH
              </h3>
              <span className="text-[13px] font-bold text-on-surface-variant">{progressPercent}%</span>
            </div>
            <div>
              <div className="w-full bg-surface-container-highest rounded-full h-2.5 mb-1.5 overflow-hidden">
                <div className="bg-tertiary h-2.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="flex justify-between text-[11px] font-medium text-on-surface-variant">
                <span>{hariTerisi} Hari Terisi</span>
                <span>Target: {targetHari} Hari Aktif</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activities */}
        <section className="mb-5">
          <div className="flex justify-between items-end mb-3 px-0.5">
            <h3 className="font-headline font-bold text-[15px] text-primary">Aktivitas Terakhir</h3>
            <NavLink to="/lkh/riwayat" className="text-[12px] font-bold text-secondary hover:underline">Lihat Semua</NavLink>
          </div>
          <div className="space-y-2">
            {aktivitasTerakhir.length > 0 ? (
              aktivitasTerakhir.map((item) => (
                <div key={item.id} onClick={() => handleEditOpen(item)} className="bg-surface-container-lowest border border-outline-variant/20 p-3 rounded-xl flex items-center gap-3 hover:bg-surface-container-low transition-colors cursor-pointer group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.tipeSumber === 'jadwal' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                    <span className="material-symbols-outlined text-[20px]">{item.tipeSumber === 'jadwal' ? 'school' : 'task_alt'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[13px] text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{item.kegiatan}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-outline">{item.tipeSumber}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-[11px] font-medium text-on-surface-variant">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                  <button className="text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-5 text-on-surface-variant border-2 border-dashed border-outline-variant/30 rounded-xl">
                <span className="material-symbols-outlined text-2xl mb-1.5 opacity-50">inbox</span>
                <p className="text-[12px]">Belum ada aktivitas terekam.</p>
              </div>
            )}
          </div>
        </section>

        {/* Print Action */}
        <section>
          <NavLink to="/lkh/laporan" className="w-full py-3 bg-surface-container-highest text-primary border border-outline-variant/30 font-headline font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 hover:bg-outline-variant/20 transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">print</span>
            Cetak Laporan Bulan Ini
          </NavLink>
        </section>
      </main>

      {/* Edit Modal (Quick Action) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-[15px] text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-teal-600">edit_note</span>
                Koreksi Aktivitas
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3 bg-white dark:bg-slate-900">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kegiatan</label>
                <input 
                  type="text" 
                  value={editKegiatan} 
                  onChange={e => setEditKegiatan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-[13px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Uraian / Deskripsi</label>
                <textarea 
                  value={editUraian} 
                  onChange={e => setEditUraian(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-teal-500/50 outline-none resize-none"
                  required
                ></textarea>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-teal-700 text-white font-bold text-[13px] py-2.5 rounded-lg hover:bg-teal-800 active:scale-95 transition-all shadow-lg shadow-teal-900/20">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Quick View Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header with photo */}
            <div className="bg-gradient-to-br from-teal-700 to-cyan-900 p-5 flex flex-col items-center relative">
              <button onClick={() => setIsProfileOpen(false)} className="absolute top-3 right-3 text-white/60 hover:text-white bg-white/10 rounded-full p-1 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <div className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/30 shadow-lg">
                  <img src={profil?.avatarUrl || `https://ui-avatars.com/api/?name=${profil?.nama || 'G'}&background=0D9488&color=fff&size=128`} alt="Profil" className="w-full h-full object-cover" />
                </div>
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="material-symbols-outlined text-[14px] text-teal-700">photo_camera</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64 = event.target?.result as string;
                      let current = await db.profil.get(1);
                      if (!current) current = await db.profil.toCollection().first();
                      if (current) {
                        await db.profil.put({ ...current, avatarUrl: base64, updatedAt: Date.now() });
                        useAppStore.getState().showToast("Foto profil diperbarui!", "success");
                      }
                    };
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>
              <h2 className="text-white font-bold text-[16px] mt-3 text-center">{profil?.nama || 'Pengguna'}</h2>
              <p className="text-cyan-200 text-[12px] font-medium">NIP. {profil?.nip || '-'}</p>
            </div>

            {/* Profile Details */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5">
                <span className="material-symbols-outlined text-[18px] text-teal-600">work</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Jabatan</p>
                  <p className="text-[13px] text-slate-700 dark:text-slate-200 font-semibold truncate">{profil?.jabatan || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">military_tech</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pangkat</p>
                    <p className="text-[13px] text-slate-700 dark:text-slate-200 font-semibold truncate">{profil?.pangkat || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5">
                  <span className="material-symbols-outlined text-[16px] text-indigo-600">badge</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Golongan</p>
                    <p className="text-[13px] text-slate-700 dark:text-slate-200 font-semibold truncate">{profil?.golongan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-1 space-y-2">
                <NavLink to="/profil" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 px-3 py-2.5 rounded-lg transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-teal-700">edit</span>
                    <span className="text-[13px] font-semibold text-teal-800 dark:text-teal-300">Edit Profil Lengkap</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-teal-400 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
