import { useState, useEffect } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import CategoryManagerModal from '../components/CategoryManagerModal';
import BottomSheetSelect from '../components/BottomSheetSelect';

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Tiap Hari'];

export default function EditorAktivitas() {
  const { showToast, kategoriTugas, setKategoriTugas } = useAppStore();
  const tugasData = useLiveQuery(() => db.tugasTambahan.toArray().then(arr => arr.filter(t => !t.isDeleted)));
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageKategoriOpen, setIsManageKategoriOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [namaTugas, setNamaTugas] = useState('');
  const [kategori, setKategori] = useState(kategoriTugas[0] || '');
  const [templates, setTemplates] = useState<{hari: string, uraian: string[]}[]>([
    { hari: 'Senin', uraian: [''] }
  ]);

  useEffect(() => {
    if (isModalOpen || isManageKategoriOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen, isManageKategoriOpen]);

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
    
    if (editId) {
      await db.tugasTambahan.update(editId, {
        namaTugas,
        kategori,
        templates: cleanedTemplates,
        isDraft: false,
        updatedAt: Date.now(),
      });
      showToast("Tugas tambahan berhasil diperbarui!", "success");
    } else {
      await db.tugasTambahan.add({
        namaTugas,
        kategori,
        templates: cleanedTemplates,
        isDraft: false,
        updatedAt: Date.now(),
      });
      showToast("Tugas tambahan berhasil disimpan!", "success");
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setNamaTugas(item.namaTugas);
    setKategori(item.kategori);
    
    if (item.templates && Array.isArray(item.templates) && item.templates.length > 0) {
      setTemplates(item.templates.map((t: any) => ({
        hari: t.hari,
        uraian: Array.isArray(t.uraian) && t.uraian.length > 0 ? [...t.uraian] : ['']
      })));
    } else {
      setTemplates([{ hari: 'Senin', uraian: [''] }]);
    }
    setIsModalOpen(true);
  };

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await db.tugasTambahan.update(deleteTarget.id, { isDeleted: true, updatedAt: Date.now() });
      showToast("Tugas tambahan dihapus", "success");
      setDeleteTarget(null);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setNamaTugas('');
    setKategori(kategoriTugas[0] || '');
    setTemplates([{ hari: 'Senin', uraian: [''] }]);
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm shadow-teal-950/5">
        <div className="flex justify-between items-center w-full px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5">
            <NavLink to="/dashboard" className="text-slate-600 dark:text-slate-300 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </NavLink>
            <h1 className="font-manrope font-extrabold text-[17px] tracking-tight text-teal-950 dark:text-teal-50">
              Tugas Tambahan
            </h1>
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 transition-colors flex items-center justify-center text-teal-800 dark:text-teal-200 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </header>

      <main className="pt-14 px-4 md:px-6 max-w-3xl mx-auto space-y-3">
        
        {/* Editorial Header */}
        <div className="mb-3">
          <h2 className="font-headline font-extrabold text-teal-800 dark:text-teal-400 text-[15px] tracking-tight mb-0.5">
            Kelola Tugas & Jabatan
          </h2>
          <p className="text-slate-500 text-[11px]">
            Tugas tambahan di sini akan muncul sebagai template otomatis saat mengisi LKH.
          </p>
        </div>

        {/* List of Tugas */}
        <div className="space-y-2">
          {tugasData && tugasData.length > 0 ? (
            tugasData.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-2 justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {item.kategori}
                    </span>
                    <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">calendar_month</span>
                      {item.templates && Array.isArray(item.templates) ? item.templates.map(t => t?.hari).filter(Boolean).join(', ') : Array.isArray(item.hariRutin) ? item.hariRutin.join(', ') : (item.hariRutin || 'Tiap Hari')}
                    </span>
                  </div>
                  <h3 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100 mb-0.5">{item.namaTugas}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2">Template LKH: {item.templates && Array.isArray(item.templates) ? `${item.templates.reduce((acc, t) => acc + (t?.uraian?.length || 0), 0)} uraian kegiatan` : Array.isArray(item.deskripsiLkh) ? `${item.deskripsiLkh.length} uraian kegiatan` : (item.deskripsiLkh || '-')}</p>
                </div>
                <div className="flex gap-1.5 w-full md:w-auto justify-end">
                  <button onClick={() => handleEdit(item)} className="w-7 h-7 rounded-full bg-slate-50 hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button onClick={() => item.id && setDeleteTarget({ id: item.id, name: item.namaTugas })} className="w-7 h-7 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden my-auto">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100">{editId ? 'Edit Tugas' : 'Tambah Tugas'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-full p-1.5 transition-colors flex items-center justify-center w-6 h-6">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSimpanTugas} className="p-3 space-y-2.5 bg-white dark:bg-slate-900">
              {/* Kategori */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori</label>
                  <button 
                    type="button" 
                    onClick={() => setIsManageKategoriOpen(true)}
                    className="text-[9px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-1 rounded uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">edit</span> Kelola Kategori
                  </button>
                </div>
                <BottomSheetSelect 
                  value={kategori}
                  onChange={setKategori}
                  options={kategoriTugas}
                  title="Pilih Kategori"
                  placeholder="— Pilih Kategori —"
                  enableSearch={false}
                  enableRecent={true}
                  recentStorageKey="recent_kategori_tugas"
                  triggerClassName="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none text-left flex items-center justify-between"
                />
              </div>

              {/* Nama Tugas */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Jabatan / Tugas</label>
                <input 
                  type="text" value={namaTugas} onChange={e => setNamaTugas(e.target.value)}
                  placeholder="Contoh: Wali Kelas X-IPA 1" required
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                />
              </div>

              {/* Jadwal & Template Uraian */}
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jadwal & Uraian</label>
                  <button type="button" onClick={addHari} className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wider hover:bg-teal-100 transition-colors">
                    + Tambah Hari
                  </button>
                </div>
                
                {templates.map((templateItem, hIdx) => (
                  <div key={hIdx} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 relative">
                    {templates.length > 1 && (
                      <button type="button" onClick={() => removeHari(hIdx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200">
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    )}
                    
                    <div className="mb-2">
                      <BottomSheetSelect 
                        value={templateItem.hari}
                        onChange={val => updateHari(hIdx, val)}
                        options={HARI_OPTIONS}
                        title="Pilih Hari"
                        triggerClassName="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[12px] font-bold focus:ring-2 focus:ring-teal-500/50 outline-none text-left flex items-center justify-between"
                      />
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-teal-200 dark:border-teal-900/50">
                      {templateItem.uraian && Array.isArray(templateItem.uraian) && templateItem.uraian.map((desc, uIdx) => (
                        <div key={uIdx} className="relative group flex gap-1.5">
                          <textarea 
                            value={desc}
                            onChange={e => updateUraian(hIdx, uIdx, e.target.value)}
                            placeholder={`Uraian kegiatan ${templateItem.hari}...`}
                            rows={2}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[12px] font-medium focus:ring-2 focus:ring-teal-500/50 outline-none resize-none"
                          ></textarea>
                          {templateItem.uraian.length > 1 && (
                            <button type="button" onClick={() => removeUraian(hIdx, uIdx)} className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addUraian(hIdx)} className="text-[10px] font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">add</span> Tambah Uraian
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className={`w-full text-white font-bold text-[12px] py-2 rounded-lg active:scale-95 transition-all shadow-lg flex justify-center gap-1.5 items-center ${editId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20' : 'bg-teal-800 hover:bg-teal-900 shadow-teal-900/20'}`}>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {editId ? 'Simpan Perubahan' : 'Simpan Tugas'}
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

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Tugas Tambahan?"
        message="Tugas tambahan ini akan dihapus secara permanen beserta semua template uraian kegiatan."
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
