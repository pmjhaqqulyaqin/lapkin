import { useState } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import { NavLink } from 'react-router-dom';
import BottomSheetSelect from '../components/BottomSheetSelect';
import CategoryManagerModal from '../components/CategoryManagerModal';

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
type Hari = typeof HARI_LIST[number];

const getHariIni = (): Hari => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const today = days[new Date().getDay()];
  return HARI_LIST.includes(today as any) ? (today as Hari) : 'Senin';
};
type TipeJadwal = 'rutin' | 'piket' | 'shift';

const TIPE_OPTIONS = ['Kegiatan Rutin', 'Piket', 'Shift Kerja'] as const;
const TIPE_MAP: Record<string, TipeJadwal> = {
  'Kegiatan Rutin': 'rutin',
  'Piket': 'piket',
  'Shift Kerja': 'shift',
};
const TIPE_REVERSE: Record<TipeJadwal, string> = {
  rutin: 'Kegiatan Rutin',
  piket: 'Piket',
  shift: 'Shift Kerja',
};

const TIPE_STYLE: Record<TipeJadwal, { badge: string; dot: string; label: string; icon: string }> = {
  rutin: {
    badge: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
    dot: 'bg-accent-500',
    label: 'Rutin',
    icon: 'work',
  },
  piket: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
    label: 'Piket',
    icon: 'shield_person',
  },
  shift: {
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    label: 'Shift',
    icon: 'schedule',
  },
};

export default function JadwalPegawai() {
  const showToast = useAppStore(state => state.showToast);
  const { unitKerjaList, setUnitKerjaList, namaShiftList, setNamaShiftList, jamKerjaTetap, setJamKerjaTetap } = useAppStore();
  const [activeHari, setActiveHari] = useState<Hari>(getHariIni());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formHari, setFormHari] = useState<Hari>('Senin');
  const [formTipe, setFormTipe] = useState<string>('Kegiatan Rutin');
  const [jamMulai, setJamMulai] = useState(jamKerjaTetap.mulai);
  const [jamSelesai, setJamSelesai] = useState(jamKerjaTetap.selesai);
  const [uraianKegiatan, setUraianKegiatan] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [namaShift, setNamaShift] = useState('');

  // Jam Kerja Modal
  const [isJamKerjaModalOpen, setIsJamKerjaModalOpen] = useState(false);
  const [tempJamMulai, setTempJamMulai] = useState(jamKerjaTetap.mulai);
  const [tempJamSelesai, setTempJamSelesai] = useState(jamKerjaTetap.selesai);

  // Manage Lists Modal
  const [manageListType, setManageListType] = useState<'unitKerja' | 'namaShift' | null>(null);

  // Fetch jadwal from Dexie
  const jadwalHariIni = useLiveQuery(
    () => db.jadwalPegawai.where('hari').equals(activeHari).toArray().then(arr =>
      arr.filter(j => !j.isDeleted).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))
    ),
    [activeHari]
  );

  const handleOpenModal = () => {
    setEditId(null);
    setFormHari(activeHari);
    setFormTipe('Kegiatan Rutin');
    setJamMulai(jamKerjaTetap.mulai);
    setJamSelesai(jamKerjaTetap.selesai);
    setUraianKegiatan('');
    setUnitKerja('');
    setLokasi('');
    setNamaShift('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormHari(item.hari as Hari);
    setFormTipe(TIPE_REVERSE[item.tipe as TipeJadwal] || 'Kegiatan Rutin');
    setJamMulai(item.jamMulai);
    setJamSelesai(item.jamSelesai);
    setUraianKegiatan(item.uraianKegiatan);
    setUnitKerja(item.unitKerja || '');
    setLokasi(item.lokasi || '');
    setNamaShift(item.namaShift || '');
    setIsModalOpen(true);
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraianKegiatan) return;

    const tipe = TIPE_MAP[formTipe] || 'rutin';

    if (editId) {
      await db.jadwalPegawai.update(editId, {
        hari: formHari,
        jamMulai,
        jamSelesai,
        uraianKegiatan,
        tipe,
        unitKerja: unitKerja || undefined,
        lokasi: lokasi || undefined,
        namaShift: tipe === 'shift' ? namaShift || undefined : undefined,
        updatedAt: Date.now(),
      });
      showToast("Jadwal berhasil diperbarui!", "success");
    } else {
      await db.jadwalPegawai.add({
        hari: formHari,
        jamMulai,
        jamSelesai,
        uraianKegiatan,
        tipe,
        unitKerja: unitKerja || undefined,
        lokasi: lokasi || undefined,
        namaShift: tipe === 'shift' ? namaShift || undefined : undefined,
        warna: tipe === 'piket' ? 'amber' : tipe === 'shift' ? 'indigo' : 'teal',
        updatedAt: Date.now(),
      });
      showToast("Jadwal berhasil ditambahkan!", "success");
    }

    setIsModalOpen(false);
    if (formHari !== activeHari) {
      setActiveHari(formHari);
    }
  };

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await db.jadwalPegawai.update(deleteTarget.id, { isDeleted: true, updatedAt: Date.now() });
      showToast("Jadwal dihapus", "success");
      setDeleteTarget(null);
    }
  };

  // Save Jam Kerja
  const handleSaveJamKerja = () => {
    setJamKerjaTetap({ mulai: tempJamMulai, selesai: tempJamSelesai });
    showToast("Jam kerja tetap diperbarui!", "success");
    setIsJamKerjaModalOpen(false);
  };

  const currentTipe = TIPE_MAP[formTipe] || 'rutin';

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm shadow-accent-900/20">
        <div className="flex justify-between items-center w-full px-4 py-3 max-w-5xl mx-auto">
          <h1 className="font-manrope font-extrabold text-[17px] tracking-tight text-accent-950 dark:text-accent-200">
            Jadwal Kegiatan
          </h1>
          <button
            onClick={handleOpenModal}
            className="w-9 h-9 rounded-full bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 transition-colors flex items-center justify-center text-accent-800 dark:text-accent-200 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </header>

      <main className="pt-16 px-4 md:px-6 max-w-3xl mx-auto space-y-4">

        {/* Summary Card */}
        <div className="bg-primary-gradient rounded-2xl p-4 text-white shadow-xl shadow-accent-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-accent-200 opacity-80 mb-2.5">
              <span className="material-symbols-outlined text-[16px]">work</span>
              <span className="font-semibold text-[10px] uppercase tracking-widest">Beban Kerja</span>
            </div>
            <div className="mb-0.5">
              <span className="text-2xl font-manrope font-black">
                {jadwalHariIni ? jadwalHariIni.length : 0}
              </span>
              <span className="text-[11px] text-accent-200 font-medium ml-1.5 uppercase tracking-widest">Kegiatan ({activeHari === getHariIni() ? 'Hari Ini' : activeHari})</span>
            </div>

            {/* Jam Kerja Tetap */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 flex justify-between items-center mt-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-accent-300">schedule</span>
                <div>
                  <span className="text-[10px] font-semibold text-accent-200 block">Jam Kerja Tetap</span>
                  <span className="text-[13px] font-bold">{jamKerjaTetap.mulai} – {jamKerjaTetap.selesai}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setTempJamMulai(jamKerjaTetap.mulai);
                  setTempJamSelesai(jamKerjaTetap.selesai);
                  setIsJamKerjaModalOpen(true);
                }}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">settings</span>
              </button>
            </div>
          </div>

          {/* Decoration */}
          <div className="absolute -bottom-10 -right-10 text-white/5">
            <span className="material-symbols-outlined text-[150px]">work</span>
          </div>
        </div>

        {/* Day Filter Chips */}
        <section className="flex-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {HARI_LIST.map((hari) => (
              <button
                key={hari}
                onClick={() => setActiveHari(hari)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-inter font-bold text-[13px] transition-all ${
                  activeHari === hari
                    ? 'bg-accent-900 text-white shadow-md shadow-accent-900/20'
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
              jadwalHariIni.map((item) => {
                const style = TIPE_STYLE[item.tipe as TipeJadwal] || TIPE_STYLE.rutin;
                return (
                  <div key={item.id} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-950 shadow-sm ${style.dot}`}></div>

                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="font-manrope font-extrabold text-slate-800 dark:text-slate-100 text-[14px]">
                        {item.jamMulai} - {item.jamSelesai}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${style.badge}`}>
                        {style.label}
                      </span>
                      {item.tipe === 'shift' && item.namaShift && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                          {item.namaShift}
                        </span>
                      )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 text-[13px]">{item.uraianKegiatan}</h3>
                          {item.unitKerja && (
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{item.unitKerja}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-accent-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={() => item.id && setDeleteTarget({ id: item.id, name: item.uraianKegiatan })} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                      {item.lokasi && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 inline-flex px-2 py-1 rounded-md">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {item.lokasi}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="pl-6 py-8 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                <p>Tidak ada jadwal kegiatan pada hari {activeHari}.</p>
              </div>
            )}

            {/* Add Slot Button */}
            <div className="relative pl-6 mt-4">
              <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950"></div>
              <button
                onClick={handleOpenModal}
                className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-accent-500 dark:hover:border-accent-500 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-accent-100 dark:group-hover:bg-accent-900/40 flex items-center justify-center text-slate-500 group-hover:text-accent-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </div>
                <span className="font-semibold text-[11px] text-slate-500 group-hover:text-accent-700">Tambah Jadwal Baru</span>
              </button>
            </div>

          </div>
        </section>

        {/* Summary & Info Section */}
        <aside className="w-full md:w-80 space-y-6">

          {/* Manage Lists Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
            <h3 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100 mb-3">Kelola Opsi</h3>
            <div className="space-y-2">
              <button
                onClick={() => setManageListType('unitKerja')}
                className="w-full flex items-center gap-2.5 p-2.5 bg-accent-50 dark:bg-accent-900/20 rounded-xl hover:bg-accent-100 dark:hover:bg-accent-900/30 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-accent-600 dark:text-accent-400">domain</span>
                <div>
                  <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Unit Kerja</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{unitKerjaList.length} opsi tersedia</p>
                </div>
              </button>
              <button
                onClick={() => setManageListType('namaShift')}
                className="w-full flex items-center gap-2.5 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400">schedule</span>
                <div>
                  <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Nama Shift / Piket</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{namaShiftList.length} opsi tersedia</p>
                </div>
              </button>
            </div>
            <NavLink to="/kalender" className="w-full mt-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-accent-700 dark:text-accent-400 font-semibold text-[11px] rounded-xl transition-colors block text-center">
              Lihat Kalender Akademik
            </NavLink>
          </div>
        </aside>

      </main>

      {/* Modal Tambah/Edit Jadwal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100">
                {editId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors flex items-center justify-center w-6 h-6">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSimpan} className="p-3 space-y-2.5 bg-white dark:bg-slate-900 max-h-[70vh] overflow-y-auto">
              {/* Hari */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hari</label>
                <BottomSheetSelect
                  value={formHari}
                  onChange={(val) => setFormHari(val as Hari)}
                  options={[...HARI_LIST]}
                  title="Pilih Hari"
                  triggerClassName="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none text-left flex items-center justify-between"
                />
              </div>

              {/* Tipe Jadwal */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tipe Jadwal</label>
                <BottomSheetSelect
                  value={formTipe}
                  onChange={setFormTipe}
                  options={[...TIPE_OPTIONS]}
                  title="Pilih Tipe Jadwal"
                  triggerClassName="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none text-left flex items-center justify-between"
                />
              </div>

              {/* Jam */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Uraian Kegiatan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Uraian Kegiatan</label>
                <input
                  type="text"
                  value={uraianKegiatan}
                  onChange={(e) => setUraianKegiatan(e.target.value)}
                  placeholder="Contoh: Mengelola arsip surat masuk"
                  required
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:font-normal"
                />
              </div>

              {/* Unit Kerja */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Unit Kerja</label>
                <BottomSheetSelect
                  value={unitKerja}
                  onChange={setUnitKerja}
                  options={unitKerjaList}
                  title="Pilih Unit Kerja"
                  placeholder="— Pilih Unit Kerja —"
                  triggerClassName="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none text-left flex items-center justify-between"
                />
              </div>

              {/* Nama Shift (conditional) */}
              {currentTipe === 'shift' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Shift</label>
                  <BottomSheetSelect
                    value={namaShift}
                    onChange={setNamaShift}
                    options={namaShiftList}
                    title="Pilih Nama Shift"
                    placeholder="— Pilih Shift —"
                    triggerClassName="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none text-left flex items-center justify-between"
                  />
                </div>
              )}

              {/* Lokasi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lokasi</label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Opsional"
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:font-normal"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="w-full bg-accent-700 text-white text-[12px] font-bold py-2 rounded-lg hover:bg-accent-800 active:scale-95 transition-all shadow-lg shadow-accent-900/20">
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Jam Kerja Tetap */}
      {isJamKerjaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-xs shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-accent-600">schedule</span>
                Atur Jam Kerja Tetap
              </h2>
              <button onClick={() => setIsJamKerjaModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors flex items-center justify-center w-6 h-6">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Jam Masuk</label>
                  <input
                    type="time"
                    value={tempJamMulai}
                    onChange={(e) => setTempJamMulai(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Jam Pulang</label>
                  <input
                    type="time"
                    value={tempJamSelesai}
                    onChange={(e) => setTempJamSelesai(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
              </div>
              <button onClick={handleSaveJamKerja} className="w-full bg-accent-700 text-white text-[12px] font-bold py-2 rounded-lg hover:bg-accent-800 active:scale-95 transition-all shadow-lg shadow-accent-900/20">
                Simpan Jam Kerja
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Jadwal?"
        message="Jadwal kegiatan ini akan dihapus secara permanen."
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Category Manager for Unit Kerja / Nama Shift */}
      {manageListType === 'unitKerja' && (
        <CategoryManagerModal
          title="Kelola Unit Kerja"
          items={unitKerjaList}
          onSave={(newItems) => setUnitKerjaList(newItems)}
          onClose={() => setManageListType(null)}
        />
      )}
      {manageListType === 'namaShift' && (
        <CategoryManagerModal
          title="Kelola Nama Shift / Piket"
          items={namaShiftList}
          onSave={(newItems) => setNamaShiftList(newItems)}
          onClose={() => setManageListType(null)}
        />
      )}
    </>
  );
}
