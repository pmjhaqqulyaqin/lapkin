import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, password }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        setError(`Server mengembalikan respons tidak valid. Pastikan API sudah berjalan. (${res.status})`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || `Login gagal (HTTP ${res.status})`);
        setLoading(false);
        return;
      }

      if (data.data.role !== 'admin') {
        setError('Akun ini bukan akun administrator. Hanya akun dengan role "admin" yang bisa masuk.');
        setLoading(false);
        return;
      }

      // Simpan token admin di localStorage
      localStorage.setItem('lkd_admin_token', data.data.token);
      localStorage.setItem('lkd_admin_nama', data.data.nama);
      localStorage.setItem('lkd_admin_role', data.data.role);

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(`Gagal terhubung ke server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
            <span className="material-symbols-outlined text-3xl text-teal-400">admin_panel_settings</span>
          </div>
          <h1 className="font-manrope font-extrabold text-2xl text-white tracking-tight">Admin Panel</h1>
          <p className="text-sm text-slate-400 mt-1">Laporan Kinerja Digital — MAN 2 Lotim</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm font-medium flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">NIP / Username</label>
              <input
                type="text"
                value={nip}
                onChange={e => { setNip(e.target.value); setError(''); }}
                placeholder="admin@mandalotim.id"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 font-semibold focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 font-semibold focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Mengautentikasi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Masuk ke Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          Bukan admin? <a href="/login" className="text-teal-400 hover:underline font-semibold">Kembali ke halaman guru</a>
        </p>
      </div>
    </div>
  );
}
