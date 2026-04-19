import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import { NavLink } from 'react-router-dom';

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
type Hari = typeof HARI_LIST[number];

export default function JadwalMengajar() {
  const showToast = useAppStore(state => state.showToast);
  const [activeHari, setActiveHari] = useState<Hari>('Senin');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formHari, setFormHari] = useState<Hari>('Senin');
  const [jamMulai, setJamMulai] = useState('07:15');
  const [jamSelesai, setJamSelesai] = useState('08:45');
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [ruangan, setRuangan] = useState('');

  // Fetch jadwal dari Dexie berdasarkan hari yang aktif, urutkan berdasarkan jamMulai
  const jadwalHariIni = useLiveQuery(
    () => db.jadwal.where('hari').equals(activeHari).toArray().then(arr => 
      arr.filter(j => !j.isDeleted).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))
    ),
    [activeHari]
  );

  const handleOpenModal = () => {
    setEditId(null);
    setFormHari(activeHari);
    setJamMulai('07:15');
    setJamSelesai('08:45');
    setMapel('');
    setKelas('');
    setRuangan('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormHari(item.hari as Hari);
    setJamMulai(item.jamMulai);
    setJamSelesai(item.jamSelesai);
    setMapel(item.mataPelajaran);
    setKelas(item.kelas);
    setRuangan(item.ruangan || '');
    setIsModalOpen(true);
  };

  const handleSimpanJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapel || !kelas) return;
    
    if (editId) {
      await db.jadwal.update(editId, {
        hari: formHari,
        jamMulai,
        jamSelesai,
        mataPelajaran: mapel,
        kelas,
        ruangan,
        updatedAt: Date.now(),
      });
      showToast("Jadwal berhasil diperbarui!", "success");
    } else {
      await db.jadwal.add({
        hari: formHari,
        jamMulai,
        jamSelesai,
        mataPelajaran: mapel,
        kelas,
        ruangan,
        warna: 'teal', // Default warna
        updatedAt: Date.now(),
      });
      showToast("Jadwal berhasil ditambahkan!", "success");
    }
    
    setIsModalOpen(false);
    if (formHari !== activeHari) {
      setActiveHari(formHari);
    }
  };

  const handleDelete = async (id?: number) => {
    if (id && window.confirm("Hapus jadwal ini?")) {
      await db.jadwal.update(id, { isDeleted: true, updatedAt: Date.now() });
      showToast("Jadwal dihapus", "success");
    }
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm shadow-teal-950/5">
        <div className="flex justify-between items-center w-full px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="font-manrope font-extrabold text-xl tracking-tight text-teal-950 dark:text-teal-50">
              Jadwal Mengajar
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleOpenModal}
              className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 transition-colors flex items-center justify-center text-teal-800 dark:text-teal-200 shadow-sm"
              title="Tambah Jadwal"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-28 px-4 md:px-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Left Section: Timeline & Schedule Grid */}
        <section className="flex-1">
          {/* Day Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {HARI_LIST.map((hari) => (
              <button 
                key={hari}
                onClick={() => setActiveHari(hari)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full font-inter font-bold text-sm transition-all ${
                  activeHari === hari 
                    ? 'bg-teal-950 text-white shadow-md shadow-teal-950/20' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {hari}
              </button>
            ))}
          </div>

          {/* Timeline View */}
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8 pb-4">
            
            {jadwalHariIni && jadwalHariIni.length > 0 ? (
              jadwalHariIni.map((item) => (
                <div key={item.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-950 shadow-sm ${item.warna === 'orange' ? 'bg-orange-500' : 'bg-teal-500'}`}></div>
                  
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-manrope font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                      {item.jamMulai} - {item.jamSelesai}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${item.warna === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'}`}>
                      Kelas
                    </span>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 text-base">{item.mataPelajaran}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Kelas {item.kelas}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/50 inline-flex px-3 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                      {item.ruangan || 'Ruang Kelas'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="pl-6 py-8 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                <p>Tidak ada jadwal mengajar pada hari {activeHari}.</p>
              </div>
            )}

            {/* Empty State / Add Slot Button */}
            <div className="relative pl-6 mt-4">
              <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950"></div>
              <button 
                onClick={handleOpenModal}
                className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-teal-50 dark:hover:bg-teal-900/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 flex items-center justify-center text-slate-500 group-hover:text-teal-600 transition-colors">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="font-semibold text-sm text-slate-500 group-hover:text-teal-700">Tambah Jadwal Baru</span>
              </button>
            </div>

          </div>
        </section>

        {/* Right Section: Summary & Agenda */}
        <aside className="w-full md:w-80 space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl shadow-teal-950/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-teal-200/80 mb-4">
                <span className="material-symbols-outlined text-sm">bar_chart</span>
                <span className="font-semibold text-xs uppercase tracking-widest">Beban Mengajar</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-manrope font-black">
                  {jadwalHariIni ? jadwalHariIni.length * 2 : 0} 
                </span>
                <span className="text-teal-200 font-medium ml-2">Jam (Hari Ini)</span>
              </div>
              <p className="text-sm text-teal-100/80 mb-6">Mengajar di hari {activeHari}.</p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold">Tugas Tambahan</span>
                <span className="bg-teal-400 text-teal-950 text-xs font-bold px-2 py-1 rounded-md">Wakakur</span>
              </div>
            </div>
            
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 text-white/5">
              <span className="material-symbols-outlined text-[150px]">calendar_month</span>
            </div>
          </div>

          {/* Mini Calendar / Agenda */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
            <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 mb-4">Informasi Kalender</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400">calendar_month</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Kalender Akademik</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Atur hari libur & kegiatan khusus di menu Kalender.</p>
                </div>
              </div>
            </div>
            <NavLink to="/kalender" className="w-full mt-6 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 font-semibold text-sm rounded-xl transition-colors block text-center">
              Lihat Kalender Akademik
            </NavLink>
          </div>
        </aside>

      </main>

      {/* Modal Tambah Jadwal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100">Tambah Jadwal Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-2 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSimpanJadwal} className="p-6 space-y-4 bg-white dark:bg-slate-900">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hari</label>
                <select 
                  value={formHari}
                  onChange={(e) => setFormHari(e.target.value as Hari)}
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                >
                  {HARI_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jam Mulai</label>
                  <input 
                    type="time" 
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jam Selesai</label>
                  <input 
                    type="time" 
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mata Pelajaran</label>
                <input 
                  type="text" 
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  placeholder="Contoh: Matematika"
                  required
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none placeholder:font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kelas</label>
                  <input 
                    type="text" 
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="Contoh: X IPA 1"
                    required
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ruangan</label>
                  <input 
                    type="text" 
                    value={ruangan}
                    onChange={(e) => setRuangan(e.target.value)}
                    placeholder="Opsional"
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-teal-800 text-white font-bold py-3.5 rounded-xl hover:bg-teal-900 active:scale-95 transition-all shadow-lg shadow-teal-900/20">
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
