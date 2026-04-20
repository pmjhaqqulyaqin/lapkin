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

interface ReferensiItem {
  id: number;
  nilai: string;
  jenis: 'kegiatan' | 'tugas' | 'kalender';
}

export default function AdminReferensiTab() {
  const [data, setData] = useState<{ kegiatan: ReferensiItem[], tugas: ReferensiItem[], kalender: ReferensiItem[] }>({ kegiatan: [], tugas: [], kalender: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kegiatan' | 'tugas' | 'kalender'>('kegiatan');
  
  const [newItem, setNewItem] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ReferensiItem | null>(null);

  const fetchReferensi = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/referensi');
      const raw: ReferensiItem[] = res.raw;
      
      const grouped = {
        kegiatan: raw.filter(r => r.jenis === 'kegiatan'),
        tugas: raw.filter(r => r.jenis === 'tugas'),
        kalender: raw.filter(r => r.jenis === 'kalender'),
      };
      setData(grouped);
    } catch (err: any) {
      alert('Gagal mengambil data referensi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferensi();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    try {
      await adminFetch('/api/referensi', {
        method: 'POST',
        body: JSON.stringify({ nilai: newItem.trim(), jenis: activeTab })
      });
      setNewItem('');
      fetchReferensi();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await adminFetch(`/api/referensi/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchReferensi();
    } catch (err: any) {
      alert(err.message);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Memuat data referensi...</div>;
  }

  const currentList = data[activeTab];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        {[
          { id: 'kegiatan', label: 'Kegiatan LKH' },
          { id: 'tugas', label: 'Tugas Tambahan' },
          { id: 'kalender', label: 'Kalender Akademik' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-teal-600 text-teal-700 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <input 
            type="text" 
            value={newItem} 
            onChange={e => setNewItem(e.target.value)} 
            placeholder={`Tambah ${activeTab} baru...`}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <button type="submit" disabled={!newItem.trim()} className="bg-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-800 disabled:opacity-50 transition-colors">
            Tambah
          </button>
        </form>

        <div className="space-y-2">
          {currentList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-xl">Belum ada data referensi.</div>
          ) : (
            currentList.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.nilai}</span>
                <button onClick={() => setDeleteTarget(item)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Referensi?"
        message="Opsi ini akan dihapus dari data standar sekolah. Tindakan ini tidak mempengaruhi data yang sudah terinput oleh guru."
        itemName={deleteTarget?.nilai}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
