import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import CategoryManagerModal from '../components/CategoryManagerModal';
import BottomSheetSelect from '../components/BottomSheetSelect';

const HARI_LIST = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

// Helper: detect if user is guru based on jabatan
const TIPE_PEGAWAI_STYLE: Record<string, { badge: string; checkColor: string; label: string }> = {
  rutin: { badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300', checkColor: 'text-teal-600', label: 'Rutin' },
  piket: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', checkColor: 'text-amber-500', label: 'Piket' },
  shift: { badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', checkColor: 'text-indigo-600', label: 'Shift' },
};

export default function InputLkh() {
  const location = useLocation();
  const { showToast, kegiatanManual, setKegiatanManual } = useAppStore();
  
  // Gunakan tanggal dari navigasi (jika ada) atau hari ini
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState(location.state?.date || todayStr);

  // Calendar widget state
  const initDate = new Date(location.state?.date || todayStr);
  const [calMonth, setCalMonth] = useState(initDate.getMonth());
  const [calYear, setCalYear] = useState(initDate.getFullYear());

  // LKH data for calendar month (to show filled days)
  const lkhForCalMonth = useLiveQuery(
    () => db.lkh.where('tanggal').between(
      `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`,
      `${calYear}-${String(calMonth + 1).padStart(2, '0')}-31`,
      true, true
    ).toArray().then(arr => arr.filter(l => !l.isDeleted)),
    [calMonth, calYear]
  );

  // Kalender akademik data for calendar month
  const kalenderForCalMonth = useLiveQuery(
    () => db.kalender.where('tanggal').between(
      `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`,
      `${calYear}-${String(calMonth + 1).padStart(2, '0')}-31`,
      true, true
    ).toArray().then(arr => arr.filter(k => !k.isDeleted)),
    [calMonth, calYear]
  );

  const lkhDatesInCalMonth = new Set(lkhForCalMonth?.map(l => l.tanggal));
  
  const [isManageKegiatanOpen, setIsManageKegiatanOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [manualKegiatan, setManualKegiatan] = useState('');
  const [manualUraian, setManualUraian] = useState('');

  // Menentukan nama hari dari tanggal yang dipilih
  const dateObj = new Date(tanggal);
  const hariIni = HARI_LIST[dateObj.getDay()];

  // Cek semua entri kalender di tanggal ini (bisa lebih dari satu: global + pribadi)
  const kalenderHariIni = useLiveQuery(
    () => db.kalender.where('tanggal').equals(tanggal).toArray().then(arr => arr.filter(k => !k.isDeleted)),
    [tanggal]
  );

  // Pisahkan: entri libur vs kegiatan (non-libur)
  const liburEntries = kalenderHariIni?.filter(k => {
    const s = k.status?.toLowerCase() || '';
    return s.includes('libur') || s.includes('cuti');
  }) || [];

  const kegiatanKalenderEntries = kalenderHariIni?.filter(k => {
    const s = k.status?.toLowerCase() || '';
    return !s.includes('libur') && !s.includes('cuti');
  }) || [];

  const isLibur = liburEntries.length > 0;
  const isMinggu = hariIni === 'Minggu';
  const isDisabled = isLibur || isMinggu;



  // Detect role from profil
  const profil = useLiveQuery(() => db.profil.get(1));
  const isGuru = profil?.jabatan?.toLowerCase().includes('guru');

  // Fetch jadwal mengajar (guru) berdasarkan hari
  const jadwalHariIni = useLiveQuery(
    () => db.jadwal.where('hari').equals(hariIni).toArray().then(arr => arr.filter(j => !j.isDeleted)),
    [hariIni]
  );

  // Fetch jadwal pegawai berdasarkan hari
  const jadwalPegawaiHariIni = useLiveQuery(
    () => db.jadwalPegawai.where('hari').equals(hariIni).toArray().then(arr => 
      arr.filter(j => !j.isDeleted).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))
    ),
    [hariIni]
  );

  // Fetch tugas tambahan berdasarkan hari
  const tugasHariIni = useLiveQuery(
    () => db.tugasTambahan.toArray().then(arr => 
      arr.filter(t => {
        if (t.isDeleted) return false;
        if (t.templates && Array.isArray(t.templates)) {
          return t.templates.some(temp => temp.hari === hariIni || temp.hari === 'Tiap Hari');
        }
        // Legacy fallback
        if (Array.isArray(t.hariRutin)) {
          return t.hariRutin.includes(hariIni) || t.hariRutin.includes('Tiap Hari');
        }
        return t.hariRutin === hariIni || t.hariRutin === 'Tiap Hari';
      })
    ),
    [hariIni]
  );

  const tugasTemplates = tugasHariIni?.flatMap(t => {
    if (t.templates && Array.isArray(t.templates)) {
      const matchedTemplates = t.templates.filter(temp => temp.hari === hariIni || temp.hari === 'Tiap Hari');
      return matchedTemplates.flatMap(temp => {
        const uraians = Array.isArray(temp.uraian) ? temp.uraian : [];
        return uraians.map((desc, idx) => ({
          ...t,
          templateIndex: idx,
          deskripsiCurrent: desc,
          uniqueId: `tugas-${t.id}-${temp.hari}-${idx}`
        }));
      });
    }

    // Legacy fallback
    const templates = Array.isArray(t.deskripsiLkh) ? t.deskripsiLkh : [t.deskripsiLkh || `Melaksanakan tugas sebagai ${t.namaTugas}`];
    return templates.map((desc, idx) => ({
      ...t,
      templateIndex: idx,
      deskripsiCurrent: desc,
      uniqueId: `tugas-${t.id}-${idx}`
    }));
  }) || [];

  // Ambil LKH yang sudah ada untuk tanggal ini
  const existingLkhForDate = useLiveQuery(
    () => db.lkh.where('tanggal').equals(tanggal).toArray().then(arr => arr.filter(l => !l.isDeleted)),
    [tanggal]
  );

  // Menyimpan checked status untuk sumber otomatis (gabungan jadwal, tugas, dan kalender)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Tunggu sampai data referensi dimuat
    if (!jadwalHariIni || !existingLkhForDate) return;

    const initialChecked: Record<string, boolean> = {};
    
    // Semua item default unchecked (false). Item yang sudah tersimpan tetap false dan akan di-disable.
    jadwalHariIni.forEach(j => {
      if (j.id) initialChecked[`jadwal-${j.id}`] = false;
    });

    // Jadwal Pegawai
    jadwalPegawaiHariIni?.forEach(jp => {
      if (jp.id) initialChecked[`jadwal-pegawai-${jp.id}`] = false;
    });
    
    tugasTemplates.forEach(t => {
      initialChecked[t.uniqueId] = false;
    });

    kegiatanKalenderEntries.forEach(k => {
      if (k.id) initialChecked[`kalender-${k.id}`] = false;
    });
    
    setCheckedItems(initialChecked);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalHariIni, jadwalPegawaiHariIni, tugasHariIni, kalenderHariIni, existingLkhForDate]);

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSimpan = async (e: React.FormEvent, andLanjut: boolean = false) => {
    e.preventDefault();
    if (isDisabled) return;

    // Ambil LKH yang sudah ada untuk tanggal ini (untuk cegah duplikasi)
    const existingLkh = await db.lkh.where('tanggal').equals(tanggal).toArray();

    let savedCount = 0;
    let skippedCount = 0;

    // 1. Simpan Jadwal Otomatis yang dicentang (Guru: jadwal mengajar)
    if (jadwalHariIni) {
      const jadwalToSave = jadwalHariIni.filter(j => j.id && checkedItems[`jadwal-${j.id}`]);
      for (const j of jadwalToSave) {
        const isDuplicate = existingLkh.some(
          lkh => lkh.tipeSumber === 'jadwal' && lkh.sumberId === j.id && !lkh.isDeleted
        );
        if (isDuplicate) { skippedCount++; continue; }

        await db.lkh.add({
          tanggal: tanggal,
          kegiatan: `KBM - ${j.mataPelajaran}`,
          uraian: `Melaksanakan KBM ${j.mataPelajaran} di Kelas ${j.kelas} pada jam ${j.jamMulai} - ${j.jamSelesai}.`,
          keteranganOutput: 'Jurnal Mengajar',
          sumberId: j.id,
          tipeSumber: 'jadwal',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        savedCount++;
      }
    }

    // 1b. Simpan Jadwal Pegawai yang dicentang
    if (jadwalPegawaiHariIni) {
      const pegawaiToSave = jadwalPegawaiHariIni.filter(jp => jp.id && checkedItems[`jadwal-pegawai-${jp.id}`]);
      for (const jp of pegawaiToSave) {
        const isDuplicate = existingLkh.some(
          lkh => lkh.tipeSumber === 'jadwal' && lkh.sumberId === jp.id && !lkh.isDeleted
        );
        if (isDuplicate) { skippedCount++; continue; }

        let kegiatan = jp.uraianKegiatan;
        let uraian = `Melaksanakan ${jp.uraianKegiatan} di ${jp.unitKerja || 'kantor'} pada jam ${jp.jamMulai} - ${jp.jamSelesai}.`;
        let output = 'Dokumentasi/Laporan';

        if (jp.tipe === 'piket') {
          kegiatan = `Piket - ${jp.uraianKegiatan}`;
          uraian = `Melaksanakan tugas piket ${jp.uraianKegiatan} jam ${jp.jamMulai} - ${jp.jamSelesai}.`;
          output = 'Laporan Piket';
        } else if (jp.tipe === 'shift') {
          kegiatan = jp.namaShift || jp.uraianKegiatan;
          uraian = `Melaksanakan tugas ${jp.namaShift || 'shift'} (${jp.uraianKegiatan}) jam ${jp.jamMulai} - ${jp.jamSelesai}.`;
          output = 'Laporan Shift';
        }

        await db.lkh.add({
          tanggal: tanggal,
          kegiatan,
          uraian,
          keteranganOutput: output,
          sumberId: jp.id,
          tipeSumber: 'jadwal',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        savedCount++;
      }
    }

    // 2. Simpan Tugas Tambahan Otomatis yang dicentang
    const tugasToSave = tugasTemplates.filter(t => checkedItems[t.uniqueId]);
    for (const t of tugasToSave) {
      // Cek duplikasi berdasarkan sumberId + tipeSumber + uraian yang sama
      const isDuplicate = existingLkh.some(
        lkh => lkh.tipeSumber === 'tugas_tambahan' && lkh.sumberId === t.id && lkh.uraian === t.deskripsiCurrent && !lkh.isDeleted
      );
      if (isDuplicate) { skippedCount++; continue; }

      await db.lkh.add({
        tanggal: tanggal,
        kegiatan: t.namaTugas,
        uraian: t.deskripsiCurrent,
        keteranganOutput: 'Laporan/Dokumentasi',
        sumberId: t.id,
        tipeSumber: 'tugas_tambahan',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      savedCount++;
    }

    // 3. Simpan Kegiatan Kalender Akademik yang dicentang
    const kalenderToSave = kegiatanKalenderEntries.filter(k => k.id && checkedItems[`kalender-${k.id}`]);
    for (const k of kalenderToSave) {
      // Cek duplikasi berdasarkan sumberId + tipeSumber kalender
      const isDuplicate = existingLkh.some(
        lkh => lkh.tipeSumber === 'kalender' && lkh.sumberId === k.id && !lkh.isDeleted
      );
      if (isDuplicate) { skippedCount++; continue; }

      await db.lkh.add({
        tanggal: tanggal,
        kegiatan: k.status,
        uraian: k.keterangan || `Melaksanakan kegiatan ${k.status}.`,
        keteranganOutput: 'Dokumentasi/Laporan',
        sumberId: k.id,
        tipeSumber: 'kalender',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      savedCount++;
    }

    // 4. Simpan Manual (Jika ada isinya)
    if (manualUraian.trim()) {
      await db.lkh.add({
        tanggal: tanggal,
        kegiatan: manualKegiatan,
        uraian: manualUraian.trim(),
        keteranganOutput: 'Dokumentasi/Laporan',
        tipeSumber: 'manual',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      savedCount++;
    }

    if (skippedCount > 0 && savedCount === 0) {
      showToast(`Data untuk tanggal ini sudah pernah disimpan sebelumnya.`, "info");
    } else if (skippedCount > 0) {
      showToast(`${savedCount} aktivitas disimpan, ${skippedCount} dilewati (sudah ada).`, "success");
    } else if (savedCount > 0) {
      showToast("Aktivitas berhasil disimpan!", "success");
    } else {
      showToast("Tidak ada aktivitas yang dipilih untuk disimpan.", "info");
      return; // Jangan navigasi jika tidak ada yang disimpan
    }

    if (andLanjut) {
      // Pindah ke tanggal berikutnya, lewati hari minggu
      const nextDate = new Date(dateObj);
      nextDate.setDate(nextDate.getDate() + 1);
      if (nextDate.getDay() === 0) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      setTanggal(nextDate.toISOString().split('T')[0]);
      setManualUraian('');
      setManualKegiatan('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Tetap di halaman input, reset form manual saja
      setManualUraian('');
      setManualKegiatan('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calendar navigation
  const handleCalPrev = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else { setCalMonth(m => m - 1); }
  };
  const handleCalNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else { setCalMonth(m => m + 1); }
  };
  const handleCalDateClick = (dateStr: string) => {
    setTanggal(dateStr);
    // Navigate calendar to the selected month if different
    const d = new Date(dateStr);
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
    setIsCalendarOpen(false);
  };

  // Format header display
  const displayDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  // Count total auto items (guru uses jadwal, pegawai uses jadwalPegawai)
  const jadwalCount = isGuru ? (jadwalHariIni?.length || 0) : (jadwalPegawaiHariIni?.length || 0);
  const totalAutoItems = jadwalCount + tugasTemplates.length + kegiatanKalenderEntries.length;

  return (
    <>
      {/* Header / TopAppBar */}
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center w-full px-4 py-3 mx-auto sticky top-0 z-50 shadow-sm shadow-teal-900/5">
        <div className="flex items-center gap-2.5">
          <NavLink to="/dashboard" className="text-teal-950 dark:text-teal-50 bg-teal-900/5 p-1.5 rounded-full active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </NavLink>
          <div>
            <h1 className="font-manrope font-bold text-[15px] tracking-tight text-teal-950 dark:text-teal-50">
              Input Kinerja
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">{displayDate}</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-4 py-4">
        {/* Date Picker with Dropdown Calendar */}
        <div className="mb-4 relative">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal LKH</label>
          <button
            type="button"
            onClick={() => { setIsCalendarOpen(!isCalendarOpen); setCalMonth(dateObj.getMonth()); setCalYear(dateObj.getFullYear()); }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none transition-all shadow-sm text-left flex items-center justify-between"
          >
            <span>{dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_month</span>
          </button>

          {/* Calendar Dropdown Popover */}
          {isCalendarOpen && (
            <>
              {/* Invisible overlay to close on outside click */}
              <div className="fixed inset-0 z-[90]" onClick={() => setIsCalendarOpen(false)}></div>

              {/* Dropdown */}
              <div className="absolute left-0 right-0 top-full mt-1 z-[95] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/30 animate-scale-up overflow-hidden">
                {/* Month Navigator */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={handleCalPrev} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-500">
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <span className="font-manrope font-bold text-[12px] text-slate-800 dark:text-slate-100">
                    {new Date(calYear, calMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </span>
                  <button type="button" onClick={handleCalNext} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-500">
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="p-2.5">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                    {['Se', 'Sl', 'Ra', 'Ka', 'Ju', 'Sa', 'Mi'].map(day => (
                      <span key={day} className="text-[8px] font-bold text-slate-400 uppercase">{day}</span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {/* Empty padding */}
                    {Array.from({ length: (new Date(calYear, calMonth, 1).getDay() + 6) % 7 }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-full aspect-square"></div>
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const dayOfWeek = new Date(calYear, calMonth, dayNum).getDay();
                      const isSunday = dayOfWeek === 0;
                      const isToday = dateStr === todayStr;
                      const isSelected = dateStr === tanggal;
                      const hasLkh = lkhDatesInCalMonth.has(dateStr);

                      const kalEvent = kalenderForCalMonth?.find(k => k.tanggal === dateStr);
                      const isHoliday = isSunday || (kalEvent && (kalEvent.status.toLowerCase().includes('libur') || kalEvent.status.toLowerCase().includes('cuti')));
                      const hasKegiatanKalender = kalEvent && !kalEvent.status.toLowerCase().includes('libur') && !kalEvent.status.toLowerCase().includes('cuti');

                      let cls = "w-full aspect-square rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all active:scale-90 relative ";

                      if (isSelected) {
                        cls += "bg-teal-600 text-white shadow shadow-teal-600/30";
                      } else if (hasLkh) {
                        cls += "bg-teal-500 text-white";
                      } else if (isHoliday) {
                        cls += "bg-red-50 dark:bg-red-900/20 text-red-400";
                      } else if (hasKegiatanKalender) {
                        cls += "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400";
                      } else if (isToday) {
                        cls += "text-teal-600 border border-teal-500 bg-white dark:bg-slate-800";
                      } else {
                        const isPast = new Date(calYear, calMonth, dayNum) < new Date(new Date().setHours(0,0,0,0));
                        cls += isPast && !isSunday
                          ? "text-slate-300 dark:text-slate-600"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
                      }

                      return (
                        <button key={dayNum} type="button" onClick={() => handleCalDateClick(dateStr)} className={cls}>
                          {dayNum}
                          {hasKegiatanKalender && !isSelected && !hasLkh && <div className="w-0.5 h-0.5 rounded-full bg-cyan-500 absolute bottom-0.5"></div>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Compact Legend */}
                  <div className="flex items-center gap-2.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-teal-500"></div><span className="text-[8px] text-slate-400 font-semibold">Terisi</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-100 border border-red-200"></div><span className="text-[8px] text-slate-400 font-semibold">Libur</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm border border-teal-500"></div><span className="text-[8px] text-slate-400 font-semibold">Hari Ini</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Kalender Akademik Info — Libur */}
        {isLibur && liburEntries.map(entry => (
          <div key={entry.id || entry.tanggal} className="mb-4 p-4 rounded-2xl border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 flex items-start gap-3">
            <span className="material-symbols-outlined shrink-0 text-red-500">event_busy</span>
            <div>
              <h3 className="font-bold text-sm text-red-800 dark:text-red-400">{entry.status}</h3>
              <p className="text-[11px] mt-0.5 text-red-600 dark:text-red-300">
                {entry.keterangan} - Anda tidak perlu mengisi Laporan Kinerja hari ini.
              </p>
            </div>
          </div>
        ))}

        {/* Jadwal / Auto-Populate Section */}
        <section className="mb-5 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-manrope font-bold text-slate-800 dark:text-slate-100 text-[13px]">Jadwal & Tugas ({hariIni})</h2>
            <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Otomatis
            </span>
          </div>

          <div className="space-y-2">
            {hariIni === 'Minggu' ? (
              <p className="text-sm text-slate-500 italic">Hari Libur.</p>
            ) : (totalAutoItems === 0) ? (
              <p className="text-sm text-slate-500 italic">Tidak ada jadwal, tugas, atau kegiatan tersimpan untuk hari {hariIni}.</p>
            ) : (
              <>
                {/* Jadwal Mengajar (Guru) */}
                {isGuru && jadwalHariIni?.map((j) => {
                  const isSaved = existingLkhForDate?.some(l => l.tipeSumber === 'jadwal' && l.sumberId === j.id);
                  return (
                  <label key={`jadwal-${j.id}`} className={`flex items-start gap-3 p-3 rounded-xl transition-colors border ${isSaved ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-transparent hover:border-slate-100 dark:hover:border-slate-800'}`}>
                    <input 
                      type="checkbox" 
                      disabled={isSaved}
                      checked={!!(j.id && checkedItems[`jadwal-${j.id}`])} 
                      onChange={() => toggleCheck(`jadwal-${j.id}`)}
                      className="mt-1 w-5 h-5 rounded text-teal-600 border-slate-300 focus:ring-teal-500 disabled:opacity-50" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">KBM - {j.mataPelajaran} ({j.kelas})</h3>
                        {isSaved && <span className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Tersimpan</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{j.jamMulai} - {j.jamSelesai} • {j.ruangan}</p>
                    </div>
                  </label>
                )})}

                {/* Jadwal Pegawai */}
                {!isGuru && jadwalPegawaiHariIni?.map((jp) => {
                  const isSaved = existingLkhForDate?.some(l => l.tipeSumber === 'jadwal' && l.sumberId === jp.id);
                  const tipeStyle = TIPE_PEGAWAI_STYLE[jp.tipe] || TIPE_PEGAWAI_STYLE.rutin;
                  return (
                  <label key={`jadwal-pegawai-${jp.id}`} className={`flex items-start gap-3 p-3 rounded-xl transition-colors border ${isSaved ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-transparent hover:border-slate-100 dark:hover:border-slate-800'}`}>
                    <input 
                      type="checkbox" 
                      disabled={isSaved}
                      checked={!!(jp.id && checkedItems[`jadwal-pegawai-${jp.id}`])} 
                      onChange={() => toggleCheck(`jadwal-pegawai-${jp.id}`)}
                      className={`mt-1 w-5 h-5 rounded ${tipeStyle.checkColor} border-slate-300 disabled:opacity-50`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          {jp.tipe === 'piket' ? `Piket - ${jp.uraianKegiatan}` : jp.tipe === 'shift' ? (jp.namaShift || jp.uraianKegiatan) : jp.uraianKegiatan}
                        </h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${tipeStyle.badge}`}>{tipeStyle.label}</span>
                        {isSaved && <span className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Tersimpan</span>}
                      </div>
                      <p className="text-xs text-slate-500">{jp.jamMulai} - {jp.jamSelesai}{jp.unitKerja ? ` • ${jp.unitKerja}` : ''}</p>
                    </div>
                  </label>
                )})}


                {/* Tugas Tambahan */}
                {tugasTemplates?.map((t) => {
                  const countExisting = existingLkhForDate?.filter(l => l.tipeSumber === 'tugas_tambahan' && l.sumberId === t.id).length || 0;
                  const countTemplates = tugasTemplates.filter(temp => temp.id === t.id).length;
                  const isSaved = existingLkhForDate?.some(l => l.tipeSumber === 'tugas_tambahan' && l.sumberId === t.id && l.uraian === t.deskripsiCurrent) || (countExisting >= countTemplates);
                  return (
                  <label key={t.uniqueId} className={`flex items-start gap-3 p-3 rounded-xl transition-colors border ${isSaved ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-transparent hover:border-slate-100 dark:hover:border-slate-800'}`}>
                    <input 
                      type="checkbox" 
                      disabled={isSaved}
                      checked={!!checkedItems[t.uniqueId]} 
                      onChange={() => toggleCheck(t.uniqueId)}
                      className="mt-1 w-5 h-5 rounded text-orange-500 border-slate-300 focus:ring-orange-500 disabled:opacity-50" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{t.namaTugas} {tugasTemplates.filter(x => x.id === t.id).length > 1 ? `(${t.templateIndex + 1})` : ''}</h3>
                        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Tugas</span>
                        {isSaved && <span className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Tersimpan</span>}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{t.deskripsiCurrent}</p>
                    </div>
                  </label>
                )})}

                {/* Kegiatan Kalender Akademik (non-libur) */}
                {kegiatanKalenderEntries.map((k) => {
                  const isSaved = existingLkhForDate?.some(l => l.tipeSumber === 'kalender' && l.sumberId === k.id);
                  return (
                  <label key={`kalender-${k.id}`} className={`flex items-start gap-3 p-3 rounded-xl transition-colors border ${isSaved ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-transparent hover:border-slate-100 dark:hover:border-slate-800'}`}>
                    <input 
                      type="checkbox" 
                      disabled={isSaved}
                      checked={!!(k.id && checkedItems[`kalender-${k.id}`])} 
                      onChange={() => toggleCheck(`kalender-${k.id}`)}
                      className="mt-1 w-5 h-5 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500 disabled:opacity-50" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{k.status}</h3>
                        <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                          {k.isGlobal ? (
                            <><span className="material-symbols-outlined text-[10px]">school</span> Sekolah</>
                          ) : (
                            'Kalender'
                          )}
                        </span>
                        {isSaved && <span className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Tersimpan</span>}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{k.keterangan || `Kegiatan ${k.status}`}</p>
                    </div>
                  </label>
                )})}
              </>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8 opacity-60">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Atau</span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
        </div>

        {/* Manual Input Form */}
        <section className="mb-8">
          <h2 className="font-manrope font-bold text-slate-800 dark:text-slate-100 text-[14px] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">add_circle</span> Tambah Manual
          </h2>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pilih Kegiatan</label>
                <button 
                  type="button" 
                  onClick={() => setIsManageKegiatanOpen(true)}
                  className="text-[9px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-1 rounded uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">edit</span> Kelola Opsi
                </button>
              </div>
              <BottomSheetSelect
                value={manualKegiatan}
                onChange={setManualKegiatan}
                options={kegiatanManual}
                title="Pilih Kegiatan"
                placeholder="— Pilih Kegiatan —"
                enableSearch={true}
                enableRecent={true}
                recentStorageKey="recent_kegiatan_manual"
                triggerClassName="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-left flex items-center justify-between shadow-sm focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Uraian Pekerjaan</label>
              <textarea 
                rows={3} 
                value={manualUraian}
                onChange={(e) => setManualUraian(e.target.value)}
                placeholder="Deskripsikan pekerjaan yang dilakukan..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-700 dark:text-slate-200 text-[12px] focus:ring-2 focus:ring-teal-500/50 outline-none transition-all shadow-sm resize-none"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Save Buttons */}
        <div className="flex gap-2 mt-4">
          <button 
            type="button" 
            disabled={isDisabled}
            onClick={(e) => handleSimpan(e as any, false)}
            className={`flex-1 font-bold text-[12px] py-2.5 rounded-lg transition-all shadow-lg flex justify-center items-center gap-1.5 ${isDisabled ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-teal-800 text-white hover:bg-teal-900 active:scale-95 shadow-teal-900/20'}`}
          >
            Simpan LKH
          </button>
          <button 
            type="button" 
            disabled={isDisabled}
            onClick={(e) => handleSimpan(e as any, true)}
            className={`flex-1 font-bold text-[12px] py-2.5 rounded-lg transition-all shadow-lg flex justify-center items-center gap-1.5 ${isDisabled ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95 shadow-teal-600/20'}`}
          >
            Simpan & Lanjut <span className="material-symbols-outlined text-[16px]">skip_next</span>
          </button>
        </div>

        {/* Daftar LKH Tersimpan untuk tanggal ini */}
        {existingLkhForDate && existingLkhForDate.length > 0 && (
          <section className="mt-5 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-manrope font-bold text-slate-800 dark:text-slate-100 text-[13px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                Tersimpan ({existingLkhForDate.length})
              </h2>
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            <div className="space-y-2">
              {existingLkhForDate.map((item) => {
                const iconMap: Record<string, { icon: string; bg: string; text: string; label: string }> = {
                  jadwal: { icon: 'school', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600', label: 'KBM' },
                  tugas_tambahan: { icon: 'assignment_ind', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', label: 'Tugas' },
                  kalender: { icon: 'event_note', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600', label: 'Kalender' },
                  manual: { icon: 'edit_note', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600', label: 'Manual' },
                };
                const style = iconMap[item.tipeSumber || ''] || iconMap.manual;
                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 group">
                    <div className={`w-8 h-8 rounded-lg ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-[12px] text-slate-800 dark:text-slate-200 truncate">{item.kegiatan}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                          item.tipeSumber === 'manual' 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>{style.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.uraian}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Hapus aktivitas ini?')) {
                          await db.lkh.update(item.id!, { isDeleted: true, updatedAt: Date.now() });
                          showToast('Aktivitas dihapus.', 'info');
                        }
                      }}
                      className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 mt-1"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {isManageKegiatanOpen && (
        <CategoryManagerModal 
          title="Kelola Judul Kegiatan"
          items={kegiatanManual}
          onSave={(newItems) => {
            setKegiatanManual(newItems);
            if (!newItems.includes(manualKegiatan) && newItems.length > 0) {
              setManualKegiatan(newItems[0]);
            }
          }}
          onClose={() => setIsManageKegiatanOpen(false)}
        />
      )}
    </>
  );
}
