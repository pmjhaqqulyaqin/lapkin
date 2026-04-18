import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, NavLink } from 'react-router-dom';

export default function Profil() {
  const navigate = useNavigate();
  const logout = useAppStore((state) => state.logout);
  const { isDarkMode, toggleDarkMode, showToast } = useAppStore();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'profil' | 'atasan'>('profil');
  const [formData, setFormData] = useState({
    nama: '', nip: '', jabatan: '', pangkat: '', golongan: '',
    namaKepsek: '', nipKepsek: ''
  });

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };
  
  // Ambil data profil dari Dexie (id = 1)
  const profil = useLiveQuery(() => db.profil.get(1));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenEdit = (mode: 'profil' | 'atasan') => {
    if (profil) {
      setFormData({
        nama: profil.nama || '', nip: profil.nip || '',
        jabatan: profil.jabatan || '', pangkat: profil.pangkat || '',
        golongan: profil.golongan || '',
        namaKepsek: profil.namaKepsek || '', nipKepsek: profil.nipKepsek || ''
      });
    }
    setEditMode(mode);
    setIsModalOpen(true);
  };

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profil) {
      await db.profil.put({ ...profil, ...formData });
      showToast("Data berhasil diperbarui!", "success");
      setIsModalOpen(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (profil) {
        await db.profil.put({ ...profil, avatarUrl: base64 });
        showToast("Foto profil berhasil diperbarui!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Signature Logic ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a'; // slate-900

        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;
        
        if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
        }

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (canvas && profil) {
      const dataUrl = canvas.toDataURL('image/png');
      await db.profil.put({ ...profil, ttdUrl: dataUrl });
      showToast("Tanda tangan berhasil disimpan!", "success");
      setIsSignatureModalOpen(false);
    }
  };

  const handleOpenSignatureModal = () => {
    setIsSignatureModalOpen(true);
    // Timeout to ensure canvas is rendered before clearing
    setTimeout(() => {
        clearSignature();
    }, 100);
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md text-cyan-950 dark:text-cyan-50 font-manrope text-xl font-bold tracking-tight docked full-width top-0 sticky z-50 no-border shadow-sm shadow-cyan-900/5">
        <div className="flex justify-between items-center w-full px-6 py-4 mx-auto max-w-3xl">
          <button className="text-cyan-950 dark:text-cyan-50 scale-95 active:opacity-80 transition-all">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1>Profil & Pengaturan</h1>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-6 py-8 pb-32">
        
        {/* Profile Card Header (Bento Style) */}
        {profil && (
          <section className="bg-cyan-950 dark:bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left shadow-lg shadow-cyan-950/20 relative overflow-hidden mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/20 relative z-10 shrink-0">
              <img 
                src={profil.avatarUrl || `https://ui-avatars.com/api/?name=${profil?.nama || 'Guru'}&background=0D9488&color=fff`} 
                alt="Teacher Profile Picture" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-white relative z-10 flex-1 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h2 className="font-manrope font-extrabold text-2xl md:text-3xl tracking-tight mb-1">
                    {profil.nama}
                  </h2>
                  <p className="text-cyan-100 font-medium">NIP. {profil.nip}</p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button onClick={() => handleOpenEdit('profil')} className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 self-center md:self-start w-full">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit Profil
                  </button>
                  <label className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 self-center md:self-start w-full cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    Ubah Foto
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="bg-cyan-900/50 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  {profil.jabatan.split('/')[0] || profil.jabatan}
                </span>
                <span className="bg-cyan-900/50 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  {profil.pangkat} / {profil.golongan}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  TTD Digital Tersimpan
                </span>
              </div>
            </div>
            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          </section>
        )}

        {/* Install PWA Prompt Banner */}
        <div className="mb-6 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl p-6 text-white shadow-lg shadow-teal-900/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">install_mobile</span>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Install LKD ke HP Anda</h3>
              <p className="text-teal-50 text-sm mt-1">Akses lebih cepat & bisa digunakan secara offline layaknya aplikasi native!</p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="w-full md:w-auto whitespace-nowrap bg-white text-teal-700 hover:bg-teal-50 font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            {deferredPrompt ? 'Install Sekarang' : 'Cara Install'}
          </button>
        </div>

        {/* Bento Grid layout for details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          {/* Kepala Sekolah Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-cyan-200 dark:hover:border-cyan-900 transition-colors cursor-pointer">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">shield_person</span>
                </div>
                <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100">Kepala Sekolah</h3>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{profil?.namaKepsek || 'Belum diatur'}</p>
              <p className="text-sm text-slate-500 mt-1">NIP. {profil?.nipKepsek || '-'}</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest gap-1 group-hover:translate-x-1 transition-transform" onClick={() => handleOpenEdit('atasan')}>
              Ubah Data Atasan <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </div>

          {/* Pengaturan Aplikasi Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">settings_suggest</span>
                </div>
                <h3 className="font-manrope font-bold text-slate-800 dark:text-slate-100">Preferensi Sistem</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode Gelap (Dark Mode)</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="toggle" 
                      id="toggle" 
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                      className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-slate-200 dark:border-slate-700 appearance-none cursor-pointer" 
                    />
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"></label>
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifikasi Pengingat LKH</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" defaultChecked name="toggle2" id="toggle2" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-cyan-500 appearance-none cursor-pointer translate-x-5" />
                    <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-5 rounded-full bg-cyan-500 cursor-pointer"></label>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
        </section>

        {/* Menu List */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm mb-8">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            <li>
              <NavLink to="/kalender" className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Kalender Akademik</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/tugas" className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Manajemen Tugas Tambahan</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </NavLink>
            </li>
            <li>
              <button onClick={handleOpenSignatureModal} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">draw</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Manajemen Tanda Tangan</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </button>
            </li>
            <li>
              <a href="#" className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Sinkronisasi Data Lokal</span>
                </div>
                <span className="text-xs font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-md mr-2">Baru saja</span>
              </a>
            </li>
            <li>
              <button onClick={() => useAppStore.getState().setBantuanOpen(true)} className="w-full text-left flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">help</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Bantuan & Panduan LKD</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </button>
            </li>
          </ul>
        </section>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Keluar dari Aplikasi
        </button>

      </main>

      {/* Modal Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100">
                {editMode === 'profil' ? 'Edit Profil' : 'Data Kepala Sekolah'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-2 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveProfil} className="p-6 space-y-4 bg-white dark:bg-slate-900">
              {editMode === 'profil' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                    <input 
                      type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">NIP</label>
                    <input 
                      type="text" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jabatan</label>
                    <input 
                      type="text" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pangkat</label>
                      <input 
                        type="text" value={formData.pangkat} onChange={e => setFormData({...formData, pangkat: e.target.value})}
                        className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Golongan</label>
                      <input 
                        type="text" value={formData.golongan} onChange={e => setFormData({...formData, golongan: e.target.value})}
                        className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Kepala Sekolah</label>
                    <input 
                      type="text" value={formData.namaKepsek} onChange={e => setFormData({...formData, namaKepsek: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">NIP Kepala Sekolah</label>
                    <input 
                      type="text" value={formData.nipKepsek} onChange={e => setFormData({...formData, nipKepsek: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-4">
                <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3.5 rounded-xl hover:bg-cyan-700 active:scale-95 transition-all shadow-lg shadow-cyan-900/20">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Signature */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100">
                Tanda Tangan Digital
              </h2>
              <button onClick={() => setIsSignatureModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-2 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950">
              <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-widest text-center">Goreskan Tanda Tangan di Kotak Bawah</p>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden touch-none relative">
                <canvas
                  ref={canvasRef}
                  width={350}
                  height={200}
                  className="w-full h-[200px] cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseUp={endDrawing}
                  onMouseOut={endDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={endDrawing}
                  onTouchMove={draw}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={clearSignature} type="button" className="flex-1 bg-red-50 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 active:scale-95 transition-all">
                  Hapus
                </button>
                <button onClick={saveSignature} type="button" className="flex-[2] bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-900/20">
                  Simpan Tanda Tangan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Fallback Modal */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-manrope font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-500">install_mobile</span>
                  Cara Install LKD
                </h3>
                <button onClick={() => setIsInstallModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm">
                <p>Browser Anda tidak mendukung instalasi otomatis. Ikuti panduan manual ini:</p>
                
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Chrome_icon_%28September_2014%29.svg" className="w-4 h-4" alt="Chrome"/>
                    Chrome (Android)
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Ketuk ikon tiga titik <span className="font-bold">⋮</span> di pojok kanan atas browser.</li>
                    <li>Pilih menu <span className="font-bold text-teal-600">"Tambahkan ke Layar Utama"</span> (Add to Home Screen).</li>
                    <li>Ketuk "Tambah".</li>
                  </ol>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/52/Safari_browser_logo.svg" className="w-4 h-4" alt="Safari"/>
                    Safari (iPhone / iOS)
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Ketuk ikon Bagikan (Share) <span className="inline-block border border-slate-400 px-1 rounded mx-1 pb-0.5">↑</span> di bagian bawah layar.</li>
                    <li>Gulir ke bawah dan pilih <span className="font-bold text-teal-600">"Tambah ke Layar Utama"</span> (Add to Home Screen).</li>
                    <li>Ketuk "Tambah" di pojok kanan atas.</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => setIsInstallModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #06b6d4; /* Tailwind cyan-500 */
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #06b6d4;
        }
        .toggle-checkbox {
          right: 0;
          z-index: 1;
          transition: all 0.3s;
        }
        .toggle-label {
          width: 3rem;
        }
      `}</style>
    </>
  );
}
