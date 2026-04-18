import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import CategoryManagerModal from '../components/CategoryManagerModal';

export default function EditorAktivitas() {
  const { showToast, kategoriTugas, setKategoriTugas } = useAppStore();
  const tugasData = useLiveQuery(() => db.tugasTambahan.toArray());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageKategoriOpen, setIsManageKategoriOpen] = useState(false);
  const [namaTugas, setNamaTugas] = useState('');
  const [kategori, setKategori] = useState(kategoriTugas[0] || '');
  const [templates, setTemplates] = useState<{hari: string, uraian: string[]}[]>([
    { hari: 'Senin', uraian: [''] }
  ]);

  const addHari = () => {
    setTemplates([...templates, { hari: 'Senin', uraian: [''] }]);
  };

  const updateHari = (index: number, hari: string) => {
    const newTemplates = [...templates];
    newTemplates[index].hari = hari;
    setTemplates(newTemplates);
  };

  const removeHari = (index: number) => {
    const newTemplates = [...templates];
    newTemplates.splice(index, 1);
    if(newTemplates.length === 0) newTemplates.push({ hari: 'Senin', uraian: [''] });
    setTemplates(newTemplates);
  };

  const addUraian = (hariIndex: number) => {
    const newTemplates = [...templates];
    newTemplates[hariIndex].uraian.push('');
    setTemplates(newTemplates);
  };

  const updateUraian = (hariIndex: number, uraianIndex: number, text: string) => {
    const newTemplates = [...templates];
    newTemplates[hariIndex].uraian[uraianIndex] = text;
    setTemplates(newTemplates);
  };

  const removeUraian = (hariIndex: number, uraianIndex: number) => {
    const newTemplates = [...templates];
    newTemplates[hariIndex].uraian.splice(uraianIndex, 1);
    if (newTemplates[hariIndex].uraian.length === 0) newTemplates[hariIndex].uraian.push('');
    setTemplates(newTemplates);
  };

  const handleSimpanTugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTugas) return;
    
    // Clean up empty templates
    const cleanedTemplates = templates.map(t => ({
      hari: t.hari,
      uraian: t.uraian.filter(u => u.trim() !== '')
    })).filter(t => t.uraian.length > 0);
    
    await db.tugasTambahan.add({
      namaTugas,
      kategori,
      templates: cleanedTemplates,
      isDraft: false
    });
    
    showToast("Tugas tambahan berhasil disimpan!", "success");
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id?: number) => {
    if (id && window.confirm("Hapus tugas tambahan ini?")) {
      await db.tugasTambahan.delete(id);
      showToast("Tugas tambahan dihapus", "success");
    }
  };

  const resetForm = () => {
    setNamaTugas('');
    setKategori(kategoriTugas[0] || '');
    setTemplates([{ hari: 'Senin', uraian: [''] }]);
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm shadow-teal-950/5">
        <div className="flex justify-between items-center w-full px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <NavLink to="/dashboard" className="text-slate-600 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </NavLink>
            <h1 className="font-manrope font-extrabold text-xl tracking-tight text-teal-950 dark:text-teal-50">
              Tugas Tambahan
            </h1>
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 transition-colors flex items-center justify-center text-teal-800 dark:text-teal-200 shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </header>

      <main className="pt-20 pb-28 px-4 md:px-6 max-w-3xl mx-auto space-y-6">
        
        {/* Editorial Header */}
        <div className="mb-8">
          <h2 className="font-headline font-extrabold text-teal-800 dark:text-teal-400 text-2xl tracking-tight mb-2">
            Kelola Tugas & Jabatan
          </h2>
          <p className="text-slate-500 text-sm">
            Tugas tambahan yang Anda daftarkan di sini akan muncul sebagai template otomatis saat Anda mengisi LKH.
          </p>
        </div>

        {/* List of Tugas */}
        <div className="space-y-4">
          {tugasData && tugasData.length > 0 ? (
            tugasData.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                      {item.kategori}
                    </span>
                    <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                      Rutin: {item.templates && Array.isArray(item.templates) ? item.templates.map(t => t?.hari).filter(Boolean).join(', ') : Array.isArray(item.hariRutin) ? item.hariRutin.join(', ') : (item.hariRutin || 'Tiap Hari')}
                    </span>
                  </div>
                  <h3 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{item.namaTugas}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">Template LKH: {item.templates && Array.isArray(item.templates) ? `${item.templates.reduce((acc, t) => acc + (t?.uraian?.length || 0), 0)} uraian kegiatan` : Array.isArray(item.deskripsiLkh) ? `${item.deskripsiLkh.length} uraian kegiatan` : (item.deskripsiLkh || '-')}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button onClick={() => handleDelete(item.id)} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="material-symbols-outlined text-4xl mb-3 text-slate-300">assignment_ind</span>
              <p className="text-slate-500 font-medium">Belum ada tugas tambahan.</p>
              <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="mt-4 px-6 py-2 bg-teal-50 text-teal-700 font-bold rounded-full hover:bg-teal-100 transition-colors text-sm"
              >
                + Tambah Tugas
              </button>
            </div>
          )}
        </div>

      </main>

      {/* Modal Tambah Tugas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
              <h2 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100">Tambah Tugas Tambahan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-2 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSimpanTugas} className="p-6 space-y-5 bg-white dark:bg-slate-900">
              {/* Kategori */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Kategori</label>
                  <button 
                    type="button" 
                    onClick={() => setIsManageKategoriOpen(true)}
                    className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-1 rounded uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span> Kelola Kategori
                  </button>
                </div>
                <div className="relative">
                  <select 
                    value={kategori}
                    onChange={e => setKategori(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none appearance-none"
                  >
                    {kategoriTugas.map(kat => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-3 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Nama Tugas */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Jabatan / Tugas</label>
                <input 
                  type="text" 
                  value={namaTugas}
                  onChange={e => setNamaTugas(e.target.value)}
                  placeholder="Contoh: Wali Kelas X-IPA 1"
                  required
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                />
              </div>

              {/* Jadwal & Template Uraian */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Jadwal & Uraian Kegiatan</label>
                  <button type="button" onClick={addHari} className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded uppercase tracking-wider hover:bg-teal-100 transition-colors">
                    + Tambah Hari
                  </button>
                </div>
                
                {templates.map((templateItem, hIdx) => (
                  <div key={hIdx} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative">
                    {templates.length > 1 && (
                      <button type="button" onClick={() => removeHari(hIdx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}
                    
                    <div className="mb-3">
                      <select 
                        value={templateItem.hari}
                        onChange={e => updateHari(hIdx, e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-teal-500/50 outline-none"
                      >
                        <option value="Senin">Senin</option>
                        <option value="Selasa">Selasa</option>
                        <option value="Rabu">Rabu</option>
                        <option value="Kamis">Kamis</option>
                        <option value="Jumat">Jumat</option>
                        <option value="Sabtu">Sabtu</option>
                        <option value="Tiap Hari">Tiap Hari Kerja</option>
                      </select>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-teal-200 dark:border-teal-900/50">
                      {templateItem.uraian && Array.isArray(templateItem.uraian) && templateItem.uraian.map((desc, uIdx) => (
                        <div key={uIdx} className="relative group flex gap-2">
                          <textarea 
                            value={desc}
                            onChange={e => updateUraian(hIdx, uIdx, e.target.value)}
                            placeholder={`Uraian kegiatan ${templateItem.hari}...`}
                            rows={2}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-teal-500/50 outline-none resize-none"
                          ></textarea>
                          {templateItem.uraian.length > 1 && (
                            <button type="button" onClick={() => removeUraian(hIdx, uIdx)} className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addUraian(hIdx)} className="text-[11px] font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[14px]">add</span> Tambah Uraian
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="w-full bg-teal-800 text-white font-bold py-3.5 rounded-xl hover:bg-teal-900 active:scale-95 transition-all shadow-lg shadow-teal-900/20 flex justify-center gap-2 items-center">
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Simpan Tugas Tambahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isManageKategoriOpen && (
        <CategoryManagerModal 
          title="Kelola Kategori Tugas"
          items={kategoriTugas}
          onSave={(newItems) => {
            setKategoriTugas(newItems);
            if (!newItems.includes(kategori) && newItems.length > 0) {
              setKategori(newItems[0]);
            }
          }}
          onClose={() => setIsManageKategoriOpen(false)}
        />
      )}
    </>
  );
}
