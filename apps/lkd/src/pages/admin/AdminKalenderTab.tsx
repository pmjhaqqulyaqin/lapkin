import { useState, useEffect } from 'react';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const API_BASE = import.meta.env.VITE_API_URL || '';
function getToken() { return localStorage.getItem('lkd_admin_token'); }

async function adminFetch(url: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...options?.headers
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request gagal');
  return data;
}

interface KalenderEvent {
  id: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  keterangan: string;
}

export default function AdminKalenderTab() {
  const [events, setEvents] = useState<KalenderEvent[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [activeMonthIndex, setActiveMonthIndex] = useState(new Date().getMonth());
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: '',
    keterangan: ''
  });
  const [deleteTarget, setDeleteTarget] = useState<KalenderEvent | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/referensi');
      const data = res.data;
      setStatusOptions(data.kalender || []);
      setEvents(data.jadwal_kalender || []);
    } catch (err: any) {
      alert('Gagal mengambil data kalender: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default status if options change
  useEffect(() => {
    if (!formData.status && statusOptions.length > 0) {
      setFormData(prev => ({ ...prev, status: statusOptions[0] }));
    }
  }, [statusOptions, formData.status]);

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
    // Check if event already exists starting on this date
    const existing = events.find(e => e.tanggal_mulai === dateStr);
    if (existing) {
      handleEdit(existing);
    } else {
      setEditId(null);
      setFormData({
        tanggal_mulai: dateStr,
        tanggal_selesai: dateStr,
        status: statusOptions[0] || 'Libur Nasional',
        keterangan: ''
      });
      setIsModalOpen(true);
    }
  };

  const handleEdit = (item: KalenderEvent) => {
    setEditId(item.id);
    setFormData({
      tanggal_mulai: item.tanggal_mulai,
      tanggal_selesai: item.tanggal_selesai,
      status: item.status,
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tanggal_mulai || !formData.tanggal_selesai || !formData.status) return;

    try {
      if (editId) {
        await adminFetch(`/api/admin/kalender/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await adminFetch('/api/admin/kalender', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await adminFetch(`/api/admin/kalender/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Memuat kalender akademik...</div>;
  }

  const displayBulan = new Date(activeYear, activeMonthIndex).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  // Filter events for current month display logic
  const eventsInMonth = events.filter(e => {
    const dStart = new Date(e.tanggal_mulai);
    const dEnd = new Date(e.tanggal_selesai);
    // Check if any part of the event overlaps with the active month
    const monthStart = new Date(activeYear, activeMonthIndex, 1);
    const monthEnd = new Date(activeYear, activeMonthIndex + 1, 0);
    return dStart <= monthEnd && dEnd >= monthStart;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-manrope font-extrabold text-lg text-slate-800 dark:text-slate-100">Kalender Akademik Master</h2>
          <p className="text-sm text-slate-500 mt-1">Data kalender ini akan disinkronisasi ke seluruh perangkat guru.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-700 w-max">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-manrope font-bold text-[15px] text-slate-800 dark:text-slate-100 min-w-[120px] text-center">
            {displayBulan}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</span>
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
              
              // Check if date falls in any global event range
              const eventInfo = events.find(e => dateStr >= e.tanggal_mulai && dateStr <= e.tanggal_selesai);
              const isEvent = !!eventInfo;
              const isLiburIcon = isSunday || (eventInfo && (eventInfo.status.toLowerCase().includes('libur') || eventInfo.status.toLowerCase().includes('cuti')));

              // Determine classes
              let boxClasses = "aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border ";
              let textClasses = "text-[14px] font-bold ";
              let dotClass = "";

              if (isEvent) {
                if (isLiburIcon) {
                  boxClasses += "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400";
                } else {
                  boxClasses += "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400";
                }
                dotClass = isLiburIcon ? "bg-red-500" : "bg-cyan-500";
              } else if (isSunday) {
                boxClasses += "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-red-500";
              } else {
                boxClasses += "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300";
              }

              return (
                <div key={dayNum} onClick={() => handleDateClick(dateStr)} className={boxClasses}>
                  <span className={textClasses}>{dayNum}</span>
                  {isEvent && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${dotClass}`}></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Event List */}
        <div>
          <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-500">list_alt</span> 
            Kegiatan Bulan Ini
          </h3>
          
          <div className="space-y-3">
            {eventsInMonth.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-xl">Belum ada agenda di bulan ini.</div>
            ) : (
              eventsInMonth.sort((a,b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai)).map(item => {
                const isLibur = item.status.toLowerCase().includes('libur') || item.status.toLowerCase().includes('cuti');
                return (
                  <div key={item.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isLibur ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'}`}>
                        {item.status}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-cyan-600"><span className="material-symbols-outlined text-[14px]">edit</span></button>
                        <button onClick={() => setDeleteTarget(item)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.keterangan || '(Tanpa Keterangan)'}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {item.tanggal_mulai === item.tanggal_selesai 
                        ? new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                        : `${new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(item.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          
          <button 
            onClick={() => {
              const d = `${activeYear}-${String(activeMonthIndex + 1).padStart(2, '0')}-01`;
              handleDateClick(d);
            }} 
            className="w-full mt-4 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 font-bold text-sm py-3 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Tambah Agenda
          </button>
        </div>

      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h2 className="font-manrope font-bold text-[16px] text-slate-800 dark:text-slate-100">
                {editId ? 'Edit Agenda Kalender' : 'Tambah Agenda Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mulai</label>
                  <input 
                    type="date" required value={formData.tanggal_mulai} onChange={e => setFormData({...formData, tanggal_mulai: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Selesai</label>
                  <input 
                    type="date" required value={formData.tanggal_selesai} onChange={e => setFormData({...formData, tanggal_selesai: e.target.value})}
                    min={formData.tanggal_mulai}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status / Kategori</label>
                <div className="relative">
                  <select 
                    required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none appearance-none"
                  >
                    {statusOptions.length === 0 && <option value="">Belum ada master status</option>}
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Keterangan</label>
                <input 
                  type="text" required value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})}
                  placeholder="Misal: Libur Idul Fitri"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-[2] bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-900/20">
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Agenda?"
        message="Agenda ini akan dihapus dari kalender master sekolah."
        itemName={deleteTarget?.keterangan || 'Agenda ini'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
