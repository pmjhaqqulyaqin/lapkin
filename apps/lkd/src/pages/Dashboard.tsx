import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeMonthIndex, activeYear, setActiveMonthYear } = useAppStore();
  const profil = useLiveQuery(async () => {
    const p = await db.profil.get(1);
    if (p) return p;
    return db.profil.toCollection().first();
  });
  
  const kalenderBulanIni = useLiveQuery(
    () => db.kalender.where('tanggal').between(
      `${activeYear}-${String(activeMonthIndex + 1).padStart(2, '0')}-01`,
      `${activeYear}-${String(activeMonthIndex + 1).padStart(2, '0')}-31`
    ).toArray().then(arr => arr.filter(k => !k.isDeleted)),
    [activeMonthIndex, activeYear]
  );

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
  
  // Date Detail Modal State
  const [viewDateDetails, setViewDateDetails] = useState<{ date: string, type: 'lkh' | 'holiday', info?: string } | null>(null);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (profil !== undefined) {
      // If profile is loaded but empty/default
      if (!profil || !profil.nama || profil.nama === 'Nama Pegawai' || !profil.nip || profil.nip === '-') {
        // Delay slightly so it doesn't flash immediately on very fast loads
        const timer = setTimeout(() => setShowOnboarding(true), 500);
        return () => clearTimeout(timer);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [profil]);

  useEffect(() => {
    if (isProfileOpen || isEditModalOpen || viewDateDetails || showOnboarding) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isProfileOpen, isEditModalOpen, viewDateDetails, showOnboarding]);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi 🌤️';
    if (hour < 15) return 'Selamat Siang ☀️';
    if (hour < 18) return 'Selamat Sore 🌇';
    return 'Selamat Malam 🌙';
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-sm shadow-teal-900/5">
        <div className="flex justify-between items-center w-full px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => useAppStore.getState().setSidebarOpen(true)} className="hidden md:block text-teal-950 dark:text-teal-50 active:opacity-80 transition-all p-1">
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <div className="animate-fade-in">
              {profil ? (
                <>
                  <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">{getGreeting()}</span>
                  <h1 className="font-headline font-bold text-[16px] tracking-tight text-teal-950 dark:text-teal-50 leading-tight truncate max-w-[200px]">{profil.nama.split(' ')[0]}</h1>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">{getGreeting()}</span>
                  <h1 className="font-headline font-bold text-[16px] tracking-tight text-teal-950 dark:text-teal-50 leading-tight">Laporan Kinerja</h1>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-primary-fixed active:scale-95 transition-transform relative z-10 shrink-0 shadow-sm animate-fade-in">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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

        {/* Calendar Widget */}
        <section className="mb-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-headline font-bold text-[13px] text-primary mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Kalender LKH
          </h3>
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <span key={day} className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for padding */}
            {Array.from({ length: (new Date(activeYear, activeMonthIndex, 1).getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-lg bg-transparent"></div>
            ))}
            
            {/* Days */}
            {Array.from({ length: new Date(activeYear, activeMonthIndex + 1, 0).getDate() }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${activeYear}-${String(activeMonthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayOfWeek = new Date(activeYear, activeMonthIndex, dayNum).getDay();
              const isSunday = dayOfWeek === 0;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              // Check LKH status
              const hasLkh = uniqueDates.has(dateStr);
              
              // Check Holiday status
              const kalenderEvent = kalenderBulanIni?.find(k => k.tanggal === dateStr);
              const isHoliday = isSunday || (kalenderEvent && (kalenderEvent.status.toLowerCase().includes('libur') || kalenderEvent.status.toLowerCase().includes('cuti')));

              // Determine classes
              let boxClasses = "aspect-square rounded-lg flex items-center justify-center text-[12px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ";
              
              if (hasLkh) {
                boxClasses += "bg-teal-500 text-white shadow-sm shadow-teal-500/30";
              } else if (isHoliday) {
                boxClasses += "bg-red-50 text-red-500 border border-red-100";
              } else if (isToday) {
                boxClasses += "bg-white text-teal-600 border-2 border-teal-500 shadow-sm";
              } else {
                // Past dates that are empty -> light red border? No, just gray for now as requested
                const isPast = new Date(activeYear, activeMonthIndex, dayNum) < new Date(new Date().setHours(0,0,0,0));
                if (isPast && !isSunday) {
                  boxClasses += "bg-slate-50 text-slate-400 border border-slate-200/50";
                } else {
                  boxClasses += "bg-slate-100 text-slate-500";
                }
              }

              if (isToday && !hasLkh && !isHoliday) {
                boxClasses += " ring-2 ring-teal-500 ring-offset-1";
              }

              return (
                <button 
                  key={dayNum} 
                  title={kalenderEvent ? kalenderEvent.keterangan : (hasLkh ? 'LKH Terisi' : 'Belum Terisi')}
                  className={boxClasses}
                  onClick={() => {
                    if (hasLkh) {
                      setViewDateDetails({ date: dateStr, type: 'lkh' });
                    } else if (isHoliday) {
                      setViewDateDetails({ date: dateStr, type: 'holiday', info: kalenderEvent?.keterangan || 'Hari Libur / Minggu' });
                    } else {
                      navigate('/lkh/input', { state: { date: dateStr } });
                    }
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Activities */}
        <section className="mb-5 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-end mb-3 px-0.5">
            <h3 className="font-headline font-bold text-[15px] text-primary">Aktivitas Terakhir</h3>
            <NavLink to="/lkh/riwayat" className="text-[12px] font-bold text-secondary hover:underline">Lihat Semua</NavLink>
          </div>
          <div className="space-y-2">
            {lkhBulanIni === undefined ? (
              // Skeleton Loader
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant/20 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-surface-container-high rounded w-3/4 animate-pulse"></div>
                    <div className="h-2.5 bg-surface-container-high rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : aktivitasTerakhir.length > 0 ? (
              aktivitasTerakhir.map((item) => (
                <div key={item.id} onClick={() => handleEditOpen(item)} className="bg-surface-container-lowest border border-outline-variant/20 p-3 rounded-xl flex items-center gap-3 hover:bg-surface-container-low transition-colors cursor-pointer group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.tipeSumber === 'jadwal' ? 'bg-primary/10 text-primary' : item.tipeSumber === 'kalender' ? 'bg-cyan-500/10 text-cyan-600' : 'bg-tertiary/10 text-tertiary'}`}>
                    <span className="material-symbols-outlined text-[20px]">{item.tipeSumber === 'jadwal' ? 'school' : item.tipeSumber === 'kalender' ? 'event_note' : 'task_alt'}</span>
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
        <section className="opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
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

      {/* Date Detail Modal */}
      {viewDateDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewDateDetails(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <h2 className="font-manrope font-bold text-[15px] text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-teal-600">
                  {viewDateDetails.type === 'lkh' ? 'list_alt' : 'event_busy'}
                </span>
                {new Date(viewDateDetails.date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={() => setViewDateDetails(null)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-3">
              {viewDateDetails.type === 'holiday' ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl">event_busy</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Hari Libur</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{viewDateDetails.info}</p>
                </div>
              ) : (
                <>
                  {lkhBulanIni?.filter(item => item.tanggal === viewDateDetails.date).map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-sm relative group">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.tipeSumber === 'jadwal' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' : item.tipeSumber === 'kalender' ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                          <span className="material-symbols-outlined">{item.tipeSumber === 'jadwal' ? 'school' : item.tipeSumber === 'kalender' ? 'event_note' : 'task_alt'}</span>
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">{item.tipeSumber}</span>
                          <h4 className="font-bold text-[13px] text-slate-800 dark:text-slate-100 mb-1 leading-snug">{item.kegiatan}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{item.uraian}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setViewDateDetails(null); handleEditOpen(item); }} 
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors flex items-center justify-center opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Koreksi"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => {
                        const date = viewDateDetails.date;
                        setViewDateDetails(null);
                        navigate('/lkh/input', { state: { date } });
                      }}
                      className="text-[12px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 px-4 py-2 rounded-full transition-colors inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Tambah Aktivitas Lain
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up text-center p-6 border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
              <span className="material-symbols-outlined text-[32px]">manage_accounts</span>
            </div>
            <h2 className="font-headline font-bold text-[18px] text-slate-800 dark:text-slate-100 mb-2">Selamat Datang di LKD!</h2>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Sebelum mulai mengisi laporan kinerja harian, Anda wajib melengkapi <strong>Data Profil</strong> (Nama dan NIP).
            </p>
            <button 
              onClick={() => {
                setShowOnboarding(false);
                navigate('/profil', { state: { openEdit: 'profil' } });
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition-all active:scale-95"
            >
              Lengkapi Profil Sekarang
            </button>
          </div>
        </div>
      )}
    </>
  );
}
