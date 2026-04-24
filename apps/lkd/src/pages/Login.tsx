import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { syncLogin, fullSync } from '../db/syncEngine';

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const showToast = useAppStore((state) => state.showToast);
  const pullReferensiData = useAppStore((state) => state.pullReferensiData);

  const [isRegister, setIsRegister] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({ nip: '', password: '', nama: '' });

  // Server sync login state
  const [isSyncLogin, setIsSyncLogin] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const isLoggedIn = useAppStore(state => state.isLoggedIn);
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSyncLogin) {
      // ── Server Sync Login ──
      // Login ke server, tarik semua data, lalu masuk ke aplikasi
      setIsLoading(true);
      try {
        await syncLogin(formData.nip, formData.password);
        showToast('Login server berhasil! Mengambil data...', 'info');
        
        // Tarik semua data dari server ke Dexie lokal
        const result = await fullSync();
        await pullReferensiData(); // Tarik opsi referensi terbaru
        showToast(`Data berhasil diambil! (↓${result.pulled} item)`, 'success');
        
        login(); // Set Zustand logged-in state
        navigate('/dashboard');
      } catch (error: any) {
        showToast(error.message || 'Gagal login ke server.', 'error');
      } finally {
        setIsLoading(false);
      }
      return;
    }

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
        nipKepsek: '-',
        updatedAt: Date.now()
      });
      await pullReferensiData(); // Tarik data referensi pertama kali
      showToast("Pendaftaran berhasil!", "success");
    } else {
      // Login - check if exists
      const profileCount = await db.profil.count();
      if (profileCount === 0) {
        showToast("Pengguna belum terdaftar di perangkat ini. Silakan daftar atau gunakan 'Login dari Server'.", "error");
        return;
      }
      await pullReferensiData(); // Coba tarik data saat login
    }
    
    login(); // Set Zustand state
    navigate('/dashboard');
  };

  // Determine labels based on mode
  const getTitle = () => {
    if (isSyncLogin) return 'Login dari Server';
    if (isRegister) return 'Daftar Pengguna Baru';
    return 'Selamat Datang Kembali';
  };

  const getSubtitle = () => {
    if (isSyncLogin) return 'Masukkan akun sinkronisasi Anda untuk mengambil semua data dari server ke perangkat ini.';
    if (isRegister) return 'Silakan isi NIP dan Nama Anda untuk mengatur profil pada perangkat ini.';
    return 'Silakan masuk menggunakan NIP dan kata sandi Anda untuk mengakses dashboard.';
  };

  const getButtonLabel = () => {
    if (isLoading) return 'Menghubungkan...';
    if (isSyncLogin) return 'Login & Ambil Data dari Server';
    if (isRegister) return 'Daftar Sekarang';
    return 'Masuk ke Aplikasi';
  };

  return (
    <main className="relative md:min-h-screen flex flex-col md:flex-row overflow-hidden bg-primary-gradient md:bg-slate-50 md:dark:bg-slate-900">
      {/* Left Section: Visual & Brand Identity */}
      <section className="relative w-full md:w-1/2 md:min-h-screen flex flex-col justify-start md:justify-between p-6 pb-3 md:p-8 lg:p-16 md:bg-primary-gradient text-white overflow-hidden">
        
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
          <img
            src="/logo login.png"
            alt="Logo MAN 2 Lombok Timur"
            className="w-12 h-12 object-contain drop-shadow-lg"
          />
          <div>
            <h1 className="font-manrope font-bold text-xl tracking-wide">MAN 2 Lombok Timur</h1>
            <p className="text-sm text-cyan-200 opacity-80">Kementerian Agama RI</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 mt-4 md:mt-0">
          <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-xs font-semibold text-cyan-300 tracking-widest uppercase mb-6">
            Versi 2.0 (PWA)
          </span>
          <h2 className="font-manrope font-extrabold text-2xl md:text-4xl lg:text-5xl leading-tight mb-3 md:mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-200">
            Laporan Kinerja Digital
          </h2>
          <p className="text-cyan-100/80 max-w-md text-xs md:text-sm lg:text-base leading-relaxed">
            Platform pintar untuk mengelola aktivitas harian, jadwal mengajar, dan mencetak laporan kinerja bulanan dengan format standar secara otomatis.
          </p>
        </div>

        {/* Footer/Copyright */}
        <div className="relative z-10 hidden md:block text-xs text-white/50">
          &copy; 2026 MAN 2 Lombok Timur. Hak Cipta Dilindungi.
        </div>
      </section>

      {/* Right Section: Login Form Canvas */}
      <section className="relative w-full md:w-1/2 flex flex-col md:flex-row items-center justify-center px-5 py-4 md:p-8 lg:p-16 md:bg-white md:dark:bg-slate-900 md:rounded-none z-10">
        <div className="w-full max-w-sm md:max-w-md bg-white dark:bg-slate-800 md:bg-transparent md:dark:bg-transparent rounded-2xl md:rounded-none shadow-2xl md:shadow-none p-6 md:p-0">
          <div className="mb-6 md:mb-10 text-center md:text-left">
            <h3 className="font-manrope font-extrabold text-2xl lg:text-3xl text-slate-800 dark:text-slate-100 mb-2">
              {getTitle()}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {getSubtitle()}
            </p>
          </div>

          {/* Server Sync Login Banner */}
          {isSyncLogin && (
            <div className="mb-6 p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-200 dark:border-cyan-800 flex items-start gap-3">
              <span className="material-symbols-outlined text-cyan-500 shrink-0 mt-0.5">cloud_sync</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Fitur ini akan menghubungkan perangkat ini ke server dan mengunduh semua data (profil, jadwal, LKH, dll) yang sudah Anda sinkronkan dari perangkat lain.
              </p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegister && !isSyncLogin && (
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
                {isSyncLogin ? 'Password Sinkronisasi' : 'Kata Sandi'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-cyan-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {!isSyncLogin && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Ingat saya</span>
                </label>
                <a href="#" className="text-sm font-bold text-cyan-600 hover:text-cyan-700 hover:underline transition-all">
                  Lupa Sandi?
                </a>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-4 rounded-xl mt-8 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                isSyncLogin
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-900/20 hover:opacity-90'
                  : 'bg-gradient-to-r from-cyan-700 to-cyan-900 text-white shadow-cyan-900/20 hover:opacity-90'
              }`}
            >
              {isLoading && <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>}
              {getButtonLabel()}
              {!isLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>

          {/* Mode Switchers */}
          <div className="mt-6 space-y-3 text-center">
            {/* Toggle between Login / Register */}
            {!isSyncLogin && (
              <button 
                onClick={() => setIsRegister(!isRegister)} 
                className="text-sm font-semibold text-slate-500 hover:text-cyan-600 transition-colors block w-full"
              >
                {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum mendaftar? Daftar di sini'}
              </button>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">atau</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            </div>

            {/* Toggle Server Sync Login */}
            <button 
              onClick={() => {
                setIsSyncLogin(!isSyncLogin);
                setIsRegister(false);
              }} 
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                isSyncLogin
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSyncLogin ? 'arrow_back' : 'cloud_download'}
              </span>
              {isSyncLogin ? 'Kembali ke Login Biasa' : 'Punya data di perangkat lain? Login dari Server'}
            </button>
          </div>

        </div>

        {/* PWA Install Banner — di atas gradient (mobile) / di dalam card area (desktop) */}
        <div className="w-full max-w-sm md:max-w-md mt-4 p-3 md:p-4 md:mt-8 rounded-xl flex items-start gap-3 bg-white/10 border border-white/20 md:bg-amber-50 md:dark:bg-amber-900/20 md:border-amber-200/50 md:dark:border-amber-700/50">
          <span className="material-symbols-outlined text-cyan-300 md:text-amber-500 shrink-0">install_mobile</span>
          <div>
            <h4 className="text-sm font-bold text-white/90 md:text-amber-800 md:dark:text-amber-400">Install Aplikasi</h4>
            <p className="text-xs text-white/60 md:text-amber-700/80 md:dark:text-amber-500/80 mt-1 leading-relaxed">
              Aplikasi ini mendukung mode Offline. Install ke layar utama HP Anda melalui menu browser (Tambahkan ke Layar Utama).
            </p>
          </div>
        </div>

        {/* Copyright — mobile only */}
        <p className="pt-4 pb-2 text-center text-[11px] text-white/40 md:hidden">
          &copy; 2026 MAN 2 Lombok Timur. Hak Cipta Dilindungi.
        </p>
      </section>
    </main>
  );
}
