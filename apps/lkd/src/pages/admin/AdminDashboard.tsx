import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import AdminReferensiTab from './AdminReferensiTab';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Stats {
  totalGuru: number;
  totalGuruSynced: number;
  totalLkhBulanIni: number;
  guruAktifHariIni: number;
  topUsers: { id: number; nama: string; nip: string; lkhCount: number }[];
}

interface User {
  id: number; nip: string; nama: string; jabatan: string;
  totalLkh: number; totalJadwal: number; lastLkhSync: number | null;
}

function getToken() { return localStorage.getItem('lkd_admin_token'); }

async function adminFetch(url: string) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request gagal');
  return data;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminNama = localStorage.getItem('lkd_admin_nama') || 'Admin';
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'referensi'>('overview');
  const [actionTarget, setActionTarget] = useState<{ userId: number; type: 'reset' | 'delete'; userName: string } | null>(null);

  useEffect(() => {
    if (!getToken()) { navigate('/admin/login'); return; }
    Promise.all([adminFetch('/api/admin/stats'), adminFetch('/api/admin/users')])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data); })
      .catch(() => { localStorage.removeItem('lkd_admin_token'); navigate('/admin/login'); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lkd_admin_token');
    localStorage.removeItem('lkd_admin_nama');
    navigate('/admin/login');
  };

  const handleUserActionConfirm = async () => {
    if (!actionTarget) return;
    const { userId, type } = actionTarget;
    
    try {
      const url = type === 'reset' ? `/api/admin/users/${userId}/reset` : `/api/admin/users/${userId}`;
      const res = await fetch(`${API_BASE}${url}`, {
        method: type === 'reset' ? 'POST' : 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal');
      alert(data.message || 'Berhasil');
      
      // Refresh user list
      adminFetch('/api/admin/users').then(u => setUsers(u.data));
    } catch(err: any) {
      alert(err.message);
    } finally {
      setActionTarget(null);
    }
  };

  const fmtDate = (ts: number | null) => ts ? new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Belum pernah';

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-700 dark:text-teal-400">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="font-manrope font-extrabold text-lg text-slate-800 dark:text-slate-100">Admin Panel</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LKD — MAN 2 Lotim</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg">{adminNama}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-100 dark:border-slate-800 w-max overflow-x-auto">
          {(['overview', 'users', 'referensi'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === t ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <span className="material-symbols-outlined text-[16px] mr-1 align-middle">
                {t === 'overview' ? 'dashboard' : t === 'users' ? 'group' : 'list_alt'}
              </span>
              {t === 'overview' ? 'Ringkasan' : t === 'users' ? 'Daftar Guru' : 'Master Referensi'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'referensi' && <AdminReferensiTab />}

        {/* Overview */}
        {tab === 'overview' && stats && (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: 'group', label: 'Total Guru', val: stats.totalGuru, bg: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30' },
              { icon: 'cloud_sync', label: 'Sudah Sync', val: stats.totalGuruSynced, bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' },
              { icon: 'description', label: 'LKH Bulan Ini', val: stats.totalLkhBulanIni, bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' },
              { icon: 'today', label: 'Aktif Hari Ini', val: stats.guruAktifHariIni, bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' },
            ].map(c => (
              <div key={c.icon} className={`${c.bg} rounded-2xl p-5 border`}>
                <span className="material-symbols-outlined text-2xl opacity-70 mb-3 block">{c.icon}</span>
                <div className="font-manrope font-extrabold text-2xl">{c.val}</div>
                <p className="text-xs font-semibold opacity-70 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">emoji_events</span> Guru Paling Aktif
            </h3>
            <div className="space-y-3">
              {stats.topUsers.length > 0 ? stats.topUsers.map((u, i) => (
                <NavLink key={u.id} to={`/admin/users/${u.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{u.nama}</h4>
                    <p className="text-xs text-slate-500">NIP: {u.nip}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-manrope font-extrabold text-lg text-teal-700 dark:text-teal-400">{u.lkhCount}</span>
                    <p className="text-[10px] font-bold text-slate-400">LKH</p>
                  </div>
                </NavLink>
              )) : <p className="text-sm text-slate-500 text-center py-4">Belum ada data.</p>}
            </div>
          </div>
        </>)}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100">Semua Guru ({users.length})</h3>
            </div>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">NIP</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Jabatan</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">LKH</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Sync Terakhir</th>
                  <th className="px-6 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{u.nama}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{u.nip}</td>
                      <td className="px-6 py-4 text-slate-500">{u.jabatan}</td>
                      <td className="px-6 py-4 text-center"><span className="bg-teal-100 text-teal-700 px-2.5 py-1 rounded-lg font-bold text-xs">{u.totalLkh}</span></td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{fmtDate(u.lastLkhSync)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setActionTarget({ userId: u.id, type: 'reset', userName: u.nama })} title="Reset Data Sync" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">device_reset</span>
                          </button>
                          <button onClick={() => setActionTarget({ userId: u.id, type: 'delete', userName: u.nama })} title="Hapus Akun Permanen" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                          </button>
                          <NavLink to={`/admin/users/${u.id}`} className="ml-2 text-teal-600 font-bold text-xs bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors">Detail</NavLink>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <div key={u.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-teal-700">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 truncate">{u.nama}</h4>
                      <p className="text-xs text-slate-500">{u.jabatan} • {u.totalLkh} LKH</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pl-14">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setActionTarget({ userId: u.id, type: 'reset', userName: u.nama })} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">device_reset</span> Reset
                      </button>
                      <button onClick={() => setActionTarget({ userId: u.id, type: 'delete', userName: u.nama })} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-red-700 bg-red-50 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">delete_forever</span> Hapus
                      </button>
                    </div>
                    <NavLink to={`/admin/users/${u.id}`} className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg">Detail →</NavLink>
                  </div>
                </div>
              ))}
            </div>
            {users.length === 0 && <div className="py-12 text-center text-slate-500">Belum ada guru terdaftar.</div>}
          </div>
        )}
      </main>

      <ConfirmDeleteModal
        isOpen={!!actionTarget}
        title={actionTarget?.type === 'reset' ? 'Reset Data Guru?' : 'Hapus Akun Guru?'}
        message={actionTarget?.type === 'reset'
          ? 'Semua data LKH, Jadwal, dan Profil guru ini akan dihapus dari server. Akun tetap bisa login kembali.'
          : 'Akun dan seluruh data guru ini akan dihapus secara PERMANEN. Guru harus mendaftar ulang untuk menggunakan aplikasi lagi.'}
        itemName={actionTarget?.userName}
        onConfirm={handleUserActionConfirm}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
