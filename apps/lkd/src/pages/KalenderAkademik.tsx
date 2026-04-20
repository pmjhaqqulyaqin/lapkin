import React, { useState, useEffect } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CategoryManagerModal from '../components/CategoryManagerModal';
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';

export default function KalenderAkademik() {
  const { showToast, statusKalender, setStatusKalender } = useAppStore();
  const kalender = useLiveQuery(() => db.kalender.orderBy('tanggal').toArray().then(arr => arr.filter(k => !k.isDeleted)));

  // Calendar State
  const [activeMonthIndex, setActiveMonthIndex] = useState(new Date().getMonth());
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());

  // Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageStatusOpen, setIsManageStatusOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tanggal: '',
    status: '',
    keterangan: ''
  });

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // Set default status
  useEffect(() => {
    if (!formData.status && statusKalender.length > 0) {
      setFormData(prev => ({ ...prev, status: statusKalender[0] }));
    }
  }, [statusKalender, formData.status]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen || isManageStatusOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen, isManageStatusOpen]);

  const handlePrevMonth = () => {
    if (activeMonthIndex === 0) {
      setActiveMonthIndex(11);
      setActiveYear(y => y - 1);
    } else {
      setActiveMonthIndex(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonthIndex === 11) {
      setActiveMonthIndex(0);
      setActiveYear(y => y + 1);
    } else {
      setActiveMonthIndex(m => m + 1);
    }
  };

  const handleDateClick = (dateStr: string) => {
    // Check if a LOCAL (non-global) event already exists on this date
    const existing = kalender?.find(k => k.tanggal === dateStr && !k.isGlobal);
    if (existing && existing.id) {
      handleEdit(existing);
    } else {
      setEditId(null);
      setFormData({
        tanggal: dateStr,
        status: statusKalender[0] || 'Libur Nasional',
        keterangan: ''
      });
      setIsModalOpen(true);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormData({
      tanggal: item.tanggal,
      status: item.status,
      keterangan: item.keterangan
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tanggal || !formData.status || !formData.keterangan) return;

    if (editId) {
      await db.kalender.update(editId, {
        tanggal: formData.tanggal,
        status: formData.status,
        keterangan: formData.keterangan,
        updatedAt: Date.now()
      });
      showToast("Kalender diperbarui", "success");
    } else {
      // Check existing on same date (local only)
      const existing = await db.kalender.where('tanggal').equals(formData.tanggal).toArray();
      const localExisting = existing.find(e => !e.isGlobal && !e.isDeleted);
      if (localExisting && localExisting.id) {
        await db.kalender.update(localExisting.id, {
          status: formData.status,
          keterangan: formData.keterangan,
          updatedAt: Date.now()
        });
        showToast("Kalender diperbarui", "success");
      } else {
        await db.kalender.add({
          tanggal: formData.tanggal,
          status: formData.status,
          keterangan: formData.keterangan,
          isGlobal: 0,
          updatedAt: Date.now()
        });
        showToast("Ditambahkan ke kalender", "success");
      }
    }
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await db.kalender.update(deleteTarget.id, { isDeleted: true, updatedAt: Date.now() });
      showToast("Dihapus dari kalender", "success");
      setDeleteTarget(null);
    }
  };

  const displayBulan = new Date(activeYear, activeMonthIndex).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Filter events for current month
  const eventsInMonth = kalender?.filter(k => {
    const d = new Date(k.tanggal);
    return d.getMonth() === activeMonthIndex && d.getFullYear() === activeYear;
  }) || [];

  // Group by date for quick lookup
  const eventsByDate = new Map<string, typeof eventsInMonth>();
  eventsInMonth.forEach(e => {
    const arr = eventsByDate.get(e.tanggal) || [];
    arr.push(e);
    eventsByDate.set(e.tanggal, arr);
  });

  // Deduplicate for list display (group global + local)
  const uniqueEventsInMonth = [...new Map(eventsInMonth.map(e => [`${e.tanggal}-${e.status}-${e.keterangan}`, e])).values()]
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  return (
    <>
      {/* Header */}
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md text-cyan-950 dark:text-cyan-50 font-manrope text-[15px] font-bold tracking-tight docked full-width top-0 sticky z-50 no-border shadow-sm shadow-cyan-900/5">
        <div className="flex justify-between items-center w-full px-4 py-3 mx-auto max-w-3xl">
          <NavLink to="/profil" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </NavLink>
          <h1>Kalender Akademik</h1>
          <button 
            onClick={() => setIsManageStatusOpen(true)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center text-slate-500"
            title="Kelola Opsi Status"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-28">
        
        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-manrope font-bold text-[14px] text-slate-800 dark:text-slate-100 min-w-[140px] text-center">
            {displayBulan}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 mb-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
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
              
              // Check events on this date
              const dayEvents = eventsByDate.get(dateStr) || [];
              const hasGlobal = dayEvents.some(e => e.isGlobal === 1);
              const hasLocal = dayEvents.some(e => !e.isGlobal);
              const hasEvent = dayEvents.length > 0;
              
              const eventInfo = dayEvents[0];
              const isLiburIcon = isSunday || (eventInfo && (eventInfo.status.toLowerCase().includes('libur') || eventInfo.status.toLowerCase().includes('cuti')));

              // Determine classes
              let boxClasses = "aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border ";

              if (hasEvent) {
                if (isLiburIcon) {
                  boxClasses += "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400";
                } else {
                  boxClasses += "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400";
                }
              } else if (isToday) {
                boxClasses += "bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300";
              } else if (isSunday) {
                boxClasses += "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-red-400";
              } else {
                boxClasses += "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300";
              }

              return (
                <div key={dayNum} onClick={() => handleDateClick(dateStr)} className={boxClasses}>
                  <span className="text-[12px] font-bold">{dayNum}</span>
                  {hasEvent && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasGlobal && <div className="w-1 h-1 rounded-full bg-red-500"></div>}
                      {hasLocal && <div className="w-1 h-1 rounded-full bg-cyan-500"></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-[10px] text-slate-500 font-medium">Sekolah</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span className="text-[10px] text-slate-500 font-medium">Pribadi</span>
            </div>
          </div>
        </div>

        {/* Event List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-teal-500">list_alt</span> 
              Kegiatan Bulan Ini
            </h3>
            <button 
              onClick={() => {
                const d = `${activeYear}-${String(activeMonthIndex + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                handleDateClick(d);
              }} 
              className="text-[11px] font-bold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">add</span> Tambah
            </button>
          </div>
          
          <div className="space-y-2">
            {uniqueEventsInMonth.length === 0 ? (
              <div className="text-center py-6 text-slate-400 italic text-[12px] bg-slate-50 dark:bg-slate-800/50 rounded-xl">Belum ada agenda di bulan ini.</div>
            ) : (
              uniqueEventsInMonth.map(item => {
                const isLibur = item.status.toLowerCase().includes('libur') || item.status.toLowerCase().includes('cuti');
                const isGlobal = item.isGlobal === 1;
                return (
                  <div key={item.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isLibur ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'}`}>
                          {item.status}
                        </span>
                        {isGlobal && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 uppercase tracking-wider">
                            Sekolah
                          </span>
                        )}
                      </div>
                      {!isGlobal && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-cyan-600"><span className="material-symbols-outlined text-[14px]">edit</span></button>
                          <button onClick={() => item.id && setDeleteTarget({ id: item.id, name: item.keterangan })} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-[13px] text-slate-800 dark:text-slate-200">{item.keterangan}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h2 className="font-manrope font-bold text-[14px] text-slate-800 dark:text-slate-100">
                {editId ? 'Edit Agenda Pribadi' : 'Tambah Agenda Pribadi'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tanggal</label>
                <input 
                  type="date" required value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status / Kategori</label>
                <div className="relative">
                  <select 
                    required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none appearance-none"
                  >
                    {statusKalender.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Keterangan</label>
                <input 
                  type="text" required value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})}
                  placeholder="Misal: Rapat Guru"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditId(null); }} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[13px] py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-[2] bg-teal-600 text-white font-bold text-[13px] py-2.5 rounded-xl hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-900/20">
                  {editId ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus dari Kalender?"
        message="Data kalender pribadi ini akan dihapus."
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      {isManageStatusOpen && (
        <CategoryManagerModal 
          title="Kelola Opsi Status"
          items={statusKalender}
          onSave={(newItems) => {
            setStatusKalender(newItems);
            if (!newItems.includes(formData.status) && newItems.length > 0) {
              setFormData(prev => ({ ...prev, status: newItems[0] }));
            }
          }}
          onClose={() => setIsManageStatusOpen(false)}
        />
      )}
    </>
  );
}
