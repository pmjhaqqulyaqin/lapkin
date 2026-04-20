import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import CategoryManagerModal from '../components/CategoryManagerModal';

const HARI_LIST = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export default function InputLkh() {
  const navigate = useNavigate();
  const { showToast, kegiatanManual, setKegiatanManual } = useAppStore();
  // Gunakan tanggal hari ini sebagai default
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState(todayStr);
  
  const [isManageKegiatanOpen, setIsManageKegiatanOpen] = useState(false);
  
  const [manualKegiatan, setManualKegiatan] = useState(kegiatanManual[0] || '');
  const [manualUraian, setManualUraian] = useState('');

  // Menentukan nama hari dari tanggal yang dipilih
  const dateObj = new Date(tanggal);
  const hariIni = HARI_LIST[dateObj.getDay()];

  // Cek libur di kalender akademik
  const kalenderHariIni = useLiveQuery(
    () => db.kalender.where('tanggal').equals(tanggal).first(),
    [tanggal]
  );
  
  const statusLower = kalenderHariIni?.status?.toLowerCase() || '';
  const isLibur = statusLower.includes('libur') || statusLower.includes('cuti');

  // Pre-fill form jika ada kegiatan khusus di kalender
  useEffect(() => {
    if (kalenderHariIni && !isLibur) {
      setManualKegiatan(kalenderHariIni.status); // Use the custom status as the category
      // Set uraian hanya jika masih kosong, supaya tidak menimpa ketikan user secara tidak sengaja
      setManualUraian(prev => prev ? prev : kalenderHariIni.keterangan);
    } else if (!manualUraian) {
      setManualKegiatan(kegiatanManual[0] || '');
    }
  }, [kalenderHariIni, tanggal, kegiatanManual, isLibur]);

  // Fetch jadwal berdasarkan hari
  const jadwalHariIni = useLiveQuery(
    () => db.jadwal.where('hari').equals(hariIni).toArray().then(arr => arr.filter(j => !j.isDeleted)),
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

  // Menyimpan checked status untuk sumber otomatis (gabungan jadwal dan tugas)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check all automatically
    const initialChecked: Record<string, boolean> = {};
    if (jadwalHariIni) {
      jadwalHariIni.forEach(j => {
        if (j.id) initialChecked[`jadwal-${j.id}`] = true;
      });
    }
    tugasTemplates.forEach(t => {
      initialChecked[t.uniqueId] = true;
    });
    setCheckedItems(initialChecked);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalHariIni, tugasHariIni]);

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSimpan = async (e: React.FormEvent, andLanjut: boolean = false) => {
    e.preventDefault();
    if (isLibur) return;

    // Ambil LKH yang sudah ada untuk tanggal ini (untuk cegah duplikasi)
    const existingLkh = await db.lkh.where('tanggal').equals(tanggal).toArray();

    let savedCount = 0;
    let skippedCount = 0;

    // 1. Simpan Jadwal Otomatis yang dicentang
    if (jadwalHariIni) {
      const jadwalToSave = jadwalHariIni.filter(j => j.id && checkedItems[`jadwal-${j.id}`]);
      for (const j of jadwalToSave) {
        // Cek duplikasi: apakah sudah ada LKH dengan sumberId & tipeSumber yang sama
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

    // 3. Simpan Manual (Jika ada isinya)
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
      setManualKegiatan(kegiatanManual[0] || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  // Format header display
  const displayDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

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
      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        {/* Date Picker Native Input (Styled) */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal LKH</label>
          <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none transition-all shadow-sm"
            />
        </div>

        {/* Kalender Akademik Info */}
        {kalenderHariIni && (
          <div className={`mb-6 p-4 rounded-2xl border ${isLibur ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800'} flex items-start gap-3`}>
            <span className={`material-symbols-outlined shrink-0 ${isLibur ? 'text-red-500' : 'text-cyan-500'}`}>
              {isLibur ? 'event_busy' : 'event_available'}
            </span>
            <div>
              <h3 className={`font-bold text-sm ${isLibur ? 'text-red-800 dark:text-red-400' : 'text-cyan-800 dark:text-cyan-400'}`}>
                {kalenderHariIni.status}
              </h3>
              <p className={`text-[11px] mt-0.5 ${isLibur ? 'text-red-600 dark:text-red-300' : 'text-cyan-600 dark:text-cyan-300'}`}>
                {kalenderHariIni.keterangan}
                {isLibur && ' - Anda tidak perlu mengisi Laporan Kinerja hari ini.'}
              </p>
            </div>
          </div>
        )}

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
            ) : (!jadwalHariIni?.length && !tugasHariIni?.length) ? (
              <p className="text-sm text-slate-500 italic">Tidak ada jadwal atau tugas tersimpan untuk hari {hariIni}.</p>
            ) : (
              <>
                {jadwalHariIni?.map((j) => (
                  <label key={`jadwal-${j.id}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                    <input 
                      type="checkbox" 
                      checked={!!(j.id && checkedItems[`jadwal-${j.id}`])} 
                      onChange={() => toggleCheck(`jadwal-${j.id}`)}
                      className="mt-1 w-5 h-5 rounded text-teal-600 border-slate-300 focus:ring-teal-500" 
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">KBM - {j.mataPelajaran} ({j.kelas})</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{j.jamMulai} - {j.jamSelesai} • {j.ruangan}</p>
                    </div>
                  </label>
                ))}

                {tugasTemplates?.map((t) => (
                  <label key={t.uniqueId} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                    <input 
                      type="checkbox" 
                      checked={!!checkedItems[t.uniqueId]} 
                      onChange={() => toggleCheck(t.uniqueId)}
                      className="mt-1 w-5 h-5 rounded text-orange-500 border-slate-300 focus:ring-orange-500" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{t.namaTugas} {tugasTemplates.filter(x => x.id === t.id).length > 1 ? `(${t.templateIndex + 1})` : ''}</h3>
                        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Tugas</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{t.deskripsiCurrent}</p>
                    </div>
                  </label>
                ))}
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
        <section className="mb-10">
          <h2 className="font-manrope font-bold text-slate-800 dark:text-slate-100 text-base mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">add_circle</span> Tambah Manual
          </h2>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Kegiatan</label>
                <button 
                  type="button" 
                  onClick={() => setIsManageKegiatanOpen(true)}
                  className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-1 rounded uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span> Kelola Opsi
                </button>
              </div>
              <div className="relative">
                <select 
                  value={manualKegiatan}
                  onChange={(e) => setManualKegiatan(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none transition-all shadow-sm appearance-none"
                >
                  {kegiatanManual.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Uraian Pekerjaan</label>
              <textarea 
                rows={4} 
                value={manualUraian}
                onChange={(e) => setManualUraian(e.target.value)}
                placeholder="Deskripsikan pekerjaan yang dilakukan..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/50 outline-none transition-all shadow-sm resize-none"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Save Buttons */}
        <div className="flex gap-2 mt-5">
          <button 
            type="button" 
            disabled={isLibur}
            onClick={(e) => handleSimpan(e as any, false)}
            className={`flex-1 font-bold text-[13px] py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${isLibur ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-teal-800 text-white hover:bg-teal-900 active:scale-95 shadow-teal-900/20'}`}
          >
            Simpan LKH
          </button>
          <button 
            type="button" 
            disabled={isLibur}
            onClick={(e) => handleSimpan(e as any, true)}
            className={`flex-[1.5] font-bold text-[13px] py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-1.5 ${isLibur ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:opacity-90 active:scale-95 shadow-emerald-900/20'}`}
          >
            Simpan & Lanjut <span className="material-symbols-outlined text-[16px]">skip_next</span>
          </button>
        </div>
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
