import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const showToast = useAppStore((state) => state.showToast);

  const [isRegister, setIsRegister] = React.useState(false);
  const [formData, setFormData] = React.useState({ nip: '', password: '', nama: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister) {
      // Create new profile
      await db.profil.put({
        id: 1,
        nama: formData.nama,
        nip: formData.nip,
        jabatan: 'Guru',
        pangkat: '-',
        golongan: '-',
        namaKepsek: '-',
        nipKepsek: '-'
      });
      showToast("Pendaftaran berhasil!", "success");
    } else {
      // Login - check if exists
      const profileCount = await db.profil.count();
      if (profileCount === 0) {
        showToast("Pengguna belum terdaftar di perangkat ini. Silakan daftar.", "error");
        return;
      }
    }
    
    login(); // Set Zustand state
    navigate('/dashboard');
  };

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Left Section: Visual & Brand Identity */}
      <section className="relative w-full md:w-1/2 min-h-[40vh] md:min-h-screen flex flex-col justify-between p-8 lg:p-16 bg-primary-gradient text-white overflow-hidden">
        
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="absolute left-0 top-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L100,0 L100,100 Z" fill="rgba(255,255,255,0.05)" />
            <path d="M0,100 L100,0 L100,100 Z" fill="rgba(0,0,0,0.1)" />
            <circle cx="20" cy="80" r="40" fill="rgba(255,255,255,0.05)" />
            <circle cx="80" cy="20" r="30" fill="rgba(255,255,255,0.05)" />
          </svg>
        </div>

        {/* School Logo/Branding */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <span className="material-symbols-outlined text-3xl text-cyan-400">school</span>
          </div>
          <div>
            <h1 className="font-manrope font-bold text-xl tracking-wide">MAN 2 Lombok Timur</h1>
            <p className="text-sm text-cyan-200 opacity-80">Kementerian Agama RI</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 mt-12 md:mt-0">
          <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-xs font-semibold text-cyan-300 tracking-widest uppercase mb-6">
            Versi 2.0 (PWA)
          </span>
          <h2 className="font-manrope font-extrabold text-4xl lg:text-5xl leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-200">
            Laporan Kinerja Digital
          </h2>
          <p className="text-cyan-100/80 max-w-md text-sm lg:text-base leading-relaxed">
            Platform pintar untuk mengelola aktivitas harian, jadwal mengajar, dan mencetak laporan kinerja bulanan dengan format standar secara otomatis.
          </p>
        </div>

        {/* Footer/Copyright */}
        <div className="relative z-10 hidden md:block text-xs text-white/50">
          &copy; 2026 MAN 2 Lombok Timur. Hak Cipta Dilindungi.
        </div>
      </section>

      {/* Right Section: Login Form Canvas */}
      <section className="relative w-full md:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-slate-900 rounded-t-[2.5rem] md:rounded-none -mt-8 md:mt-0 z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h3 className="font-manrope font-extrabold text-2xl lg:text-3xl text-slate-800 dark:text-slate-100 mb-2">
              {isRegister ? 'Daftar Pengguna Baru' : 'Selamat Datang Kembali'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isRegister 
                ? 'Silakan isi NIP dan Nama Anda untuk mengatur profil pada perangkat ini.'
                : 'Silakan masuk menggunakan NIP dan kata sandi Anda untuk mengakses dashboard.'}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2" htmlFor="nama">
                  Nama Lengkap
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 material-symbols-outlined text-slate-400 text-[20px]">badge</span>
                  <input 
                    type="text" 
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all shadow-sm"
                    placeholder="Nama Anda"
                    required={isRegister}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2" htmlFor="nip">
                NIP / Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 material-symbols-outlined text-slate-400 text-[20px]">person</span>
                <input 
                  type="text" 
                  id="nip" 
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all shadow-sm"
                  placeholder="Masukkan NIP Anda"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2" htmlFor="password">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                <input 
                  type="password" 
                  id="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="absolute right-4 text-slate-400 hover:text-cyan-600 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Ingat saya</span>
              </label>
              <a href="#" className="text-sm font-bold text-cyan-600 hover:text-cyan-700 hover:underline transition-all">
                Lupa Sandi?
              </a>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-700 to-cyan-900 text-white font-bold py-4 rounded-xl mt-8 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-900/20"
            >
              {isRegister ? 'Daftar Sekarang' : 'Masuk ke Aplikasi'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)} 
              className="text-sm font-semibold text-slate-500 hover:text-cyan-600 transition-colors"
            >
              {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum mendaftar? Daftar di sini'}
            </button>
          </div>

          {/* Quick Setup for PWA */}
          <div className="mt-12 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/50 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500 shrink-0">install_mobile</span>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Install Aplikasi</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">
                Aplikasi ini mendukung mode Offline. Install ke layar utama HP Anda melalui menu browser (Tambahkan ke Layar Utama).
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
