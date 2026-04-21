import { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import BottomSheetSelect from '../../components/BottomSheetSelect';

const API_BASE = import.meta.env.VITE_API_URL || '';
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YEARS = ['2025', '2026', '2027'];

interface UserProfil {
  id: number; nip: string; nama: string; jabatan: string;
  pangkat: string; golongan: string; namaKepsek: string; nipKepsek: string;
}
interface LkhItem {
  tanggal: string; kegiatan: string; uraian: string;
  keteranganOutput: string; tipeSumber: string;
}
interface JadwalItem {
  hari: string; jamMulai: string; jamSelesai: string;
  mataPelajaran: string; kelas: string; ruangan: string;
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profil, setProfil] = useState<UserProfil | null>(null);
  const [lkh, setLkh] = useState<LkhItem[]>([]);
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const token = localStorage.getItem('lkd_admin_token');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    loadDetail();
  }, [id, month, year]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/users/${id}?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfil(data.data.profil);
      setLkh(data.data.lkh);
      setJadwal(data.data.jadwal);
    } catch {
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fmtBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  const namaBulan = fmtBulan.format(new Date(year, month));

  // Group LKH by tanggal
  const grouped = lkh.reduce<Record<string, LkhItem[]>>((acc, item) => {
    if (!acc[item.tanggal]) acc[item.tanggal] = [];
    acc[item.tanggal].push(item);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();
  const uniqueDays = new Set(lkh.map(l => l.tanggal));

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <NavLink to="/admin/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">arrow_back</span>
          </NavLink>
          <div className="flex-1">
            <h1 className="font-manrope font-extrabold text-lg text-slate-800 dark:text-slate-100">{profil?.nama || '-'}</h1>
            <p className="text-xs text-slate-500">NIP: {profil?.nip} • {profil?.jabatan}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profil Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">badge</span> Data Profil
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Nama', profil?.nama], ['NIP', profil?.nip], ['Jabatan', profil?.jabatan],
              ['Pangkat', profil?.pangkat], ['Golongan', profil?.golongan],
              ['Kepala Sekolah', profil?.namaKepsek], ['NIP Kepsek', profil?.nipKepsek],
            ].map(([label, val]) => (
              <div key={label as string}>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{(val as string) || '-'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Jadwal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">calendar_month</span> Jadwal Mengajar ({jadwal.length})
          </h3>
          {jadwal.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jadwal.map((j, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded">{j.hari}</span>
                    <span className="font-mono text-xs text-slate-500">{j.jamMulai}-{j.jamSelesai}</span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{j.mataPelajaran} — {j.kelas}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">Belum ada jadwal.</p>}
        </div>

        {/* LKH */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">description</span>
              Laporan Kinerja — {namaBulan} {year}
              <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-lg ml-2">{lkh.length} kegiatan • {uniqueDays.size} hari</span>
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-32">
                <BottomSheetSelect 
                  value={MONTHS[month]}
                  onChange={(val) => setMonth(MONTHS.indexOf(val))}
                  options={MONTHS}
                  title="Pilih Bulan"
                  triggerClassName="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none text-left flex items-center justify-between"
                />
              </div>
              <div className="w-24">
                <BottomSheetSelect 
                  value={year.toString()}
                  onChange={(val) => setYear(Number(val))}
                  options={YEARS}
                  title="Pilih Tahun"
                  triggerClassName="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none text-left flex items-center justify-between"
                />
              </div>
            </div>
          </div>

          {sortedDates.length > 0 ? (
            <div className="space-y-4">
              {sortedDates.map(tgl => {
                const items = grouped[tgl];
                const d = new Date(tgl);
                const fmtTgl = d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' });
                return (
                  <div key={tgl} className="border-l-4 border-teal-500 pl-4">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">{fmtTgl}</h4>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.kegiatan}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${item.tipeSumber === 'jadwal' ? 'bg-teal-100 text-teal-700' : item.tipeSumber === 'tugas_tambahan' ? 'bg-orange-100 text-orange-700' : item.tipeSumber === 'kalender' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-200 text-slate-600'}`}>{item.tipeSumber}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-xs">{item.uraian}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-40">inbox</span>
              <p>Belum ada LKH untuk bulan ini.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
