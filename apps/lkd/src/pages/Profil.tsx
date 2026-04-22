import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  fullSync, syncLogin, syncRegister,
  isSyncConfigured, getSyncUser, getLastSyncDate, clearSyncAuth,
  type SyncStatus
} from '../db/syncEngine';

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

  // Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncForm, setSyncForm] = useState({ nip: '', nama: '', password: '' });
  const [syncIsRegister, setSyncIsRegister] = useState(false);
  const syncUser = getSyncUser();
  const lastSyncDate = getLastSyncDate();

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

  const [isOnboarding, setIsOnboarding] = useState(false);
  const hasAutoOpened = useRef(false);

  const location = useLocation();
  useEffect(() => {
    // If navigated from Dashboard onboarding, open only ONCE
    if (location.state?.openEdit && profil !== undefined && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      handleOpenEdit(location.state.openEdit);
      if (location.state.onboarding) {
        setIsOnboarding(true);
      }
      // Clear the state via React Router so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, profil, navigate]);

  // --- Sync Logic ---
  const handleSyncClick = async () => {
    if (!isSyncConfigured()) {
      // Pertama kali — tampilkan modal login/register
      if (profil) {
        setSyncForm({ nip: profil.nip || '', nama: profil.nama || '', password: '' });
      }
      setIsSyncModalOpen(true);
      return;
    }

    // Sudah punya token — langsung sync
    await executeSync();
  };

  const executeSync = async (forceFullSync = false) => {
    setSyncStatus('syncing');
    setSyncMessage('Menghubungkan ke server...');
    try {
      if (forceFullSync) {
        // Reset lastSync to 0 so ALL data is pushed and pulled
        localStorage.setItem('lkd_last_sync', '0');
      }
      const result = await fullSync();
      setSyncStatus('success');
      setSyncMessage(`${result.message} (↑${result.pushed} ↓${result.pulled})`);
      showToast(`Sinkronisasi berhasil! ↑${result.pushed} dikirim, ↓${result.pulled} diterima.`, 'success');
    } catch (error: any) {
      setSyncStatus('error');
      const msg = error.message || 'Gagal sinkronisasi.';
      setSyncMessage(msg);
      showToast(msg, 'error');
    }
  };

  const handleSyncAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus('syncing');
    setSyncMessage('Menghubungkan...');
    try {
      if (syncIsRegister) {
        await syncRegister(syncForm.nip, syncForm.nama, syncForm.password);
        showToast('Akun sync berhasil dibuat!', 'success');
      } else {
        await syncLogin(syncForm.nip, syncForm.password);
        showToast('Login server berhasil!', 'success');
      }
      setIsSyncModalOpen(false);
      // Auto sync after login
      await executeSync();
    } catch (error: any) {
      setSyncStatus('error');
      setSyncMessage(error.message);
      showToast(error.message, 'error');
    }
  };

  const handleSyncLogout = () => {
    clearSyncAuth();
    setSyncStatus('idle');
    setSyncMessage('');
    showToast('Akun sinkronisasi telah diputus.', 'info');
  };

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
    try {
      // Try multiple strategies to find profil
      let current = await db.profil.get(1);
      if (!current) current = await db.profil.toCollection().first();
      if (!current) {
        const all = await db.profil.toArray();
        current = all[0];
      }
      if (!current && profil) {
        // Use the React state as last resort
        current = { ...profil };
      }
      if (!current) {
        showToast("Profil tidak ditemukan. Silakan logout dan login ulang.", "error");
        return;
      }
      if (editMode === 'atasan') {
        await db.profil.put({ ...current, namaKepsek: formData.namaKepsek, nipKepsek: formData.nipKepsek, updatedAt: Date.now() });
        showToast("Data Atasan berhasil diperbarui!", "success");
        if (isOnboarding) {
          setIsModalOpen(false);
          setIsOnboarding(false);
          // Auto trigger pull referensi
          showToast('Menarik referensi jadwal & tugas...', 'info');
          const result = await useAppStore.getState().pullReferensiData();
          if (result) {
            showToast(`Referensi sukses! Anda siap menggunakan aplikasi.`, 'success');
          } else {
            showToast('Selesai! Anda siap menggunakan aplikasi.', 'success'); // fallback if offline
          }
        } else {
          setIsModalOpen(false);
        }
      } else {
        await db.profil.put({ ...current, nama: formData.nama, nip: formData.nip, jabatan: formData.jabatan, pangkat: formData.pangkat, golongan: formData.golongan, updatedAt: Date.now() });
        showToast("Data Pegawai berhasil diperbarui!", "success");
        if (isOnboarding) {
          // Chain to atasan
          handleOpenEdit('atasan');
        } else {
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Gagal simpan profil:', err);
      showToast("Gagal menyimpan data. Coba lagi.", "error");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (profil) {
        await db.profil.put({ ...profil, avatarUrl: base64, updatedAt: Date.now() });
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
      await db.profil.put({ ...profil, ttdUrl: dataUrl, updatedAt: Date.now() });
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
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md text-cyan-950 dark:text-cyan-50 font-manrope text-[17px] font-bold tracking-tight docked full-width top-0 sticky z-50 no-border shadow-sm shadow-cyan-900/5">
        <div className="flex justify-start items-center w-full px-4 py-3 mx-auto max-w-3xl">
          <h1>Profil & Pengaturan</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-5 pb-24">
        
        {/* Profile Card Header (Bento Style) */}
        {profil && (
          <section className="bg-cyan-950 dark:bg-slate-900 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left shadow-lg shadow-cyan-950/20 relative overflow-hidden mb-4">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-3 border-white/20 relative z-10 shrink-0">
              <img 
                src={profil.avatarUrl || `https://ui-avatars.com/api/?name=${profil?.nama || 'Guru'}&background=0D9488&color=fff`} 
                alt="Teacher Profile Picture" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-white relative z-10 flex-1 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div>
                  <h2 className="font-manrope font-extrabold text-xl md:text-2xl tracking-tight mb-0.5">
                    {profil.nama}
                  </h2>
                  <p className="text-cyan-100 font-medium text-[13px]">NIP. {profil.nip}</p>
                </div>
                <div className="flex flex-row gap-2 w-full md:w-auto">
                  <button onClick={() => handleOpenEdit('profil')} className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 flex-1">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit Profil
                  </button>
                  <label className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 flex-1 cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    Ubah Foto
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center md:justify-start">
                <span className="bg-cyan-900/50 border border-cyan-800 px-2 py-1 rounded text-[10px] font-semibold tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">school</span>
                  {profil.jabatan.split('/')[0] || profil.jabatan}
                </span>
                <span className="bg-cyan-900/50 border border-cyan-800 px-2 py-1 rounded text-[10px] font-semibold tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">badge</span>
                  {profil.pangkat} / {profil.golongan}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-bold tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  TTD Tersimpan
                </span>
              </div>
            </div>
            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          </section>
        )}

        {/* Install PWA Prompt Banner */}
        <div className="mb-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-4 text-white shadow-lg shadow-teal-900/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">install_mobile</span>
            </div>
            <div>
              <h3 className="font-bold text-[13px] leading-tight">Install LKD ke HP Anda</h3>
              <p className="text-teal-50 text-[11px] mt-0.5">Akses cepat & offline!</p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="whitespace-nowrap bg-white text-teal-700 hover:bg-teal-50 font-bold text-[12px] px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0"
          >
            {deferredPrompt ? 'Install' : 'Cara Install'}
          </button>
        </div>

        {/* Bento Grid layout for details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          
          {/* Kepala Sekolah Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-cyan-200 dark:hover:border-cyan-900 transition-colors cursor-pointer">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">shield_person</span>
                </div>
                <h3 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100">Kepala Sekolah</h3>
              </div>
              <p className="font-semibold text-[13px] text-slate-700 dark:text-slate-300">{profil?.namaKepsek || 'Belum diatur'}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">NIP. {profil?.nipKepsek || '-'}</p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest gap-1 group-hover:translate-x-1 transition-transform" onClick={() => handleOpenEdit('atasan')}>
              Ubah Data Atasan <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </div>
          </div>

          {/* Pengaturan Aplikasi Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
                </div>
                <h3 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100">Preferensi Sistem</h3>
              </div>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Mode Gelap</span>
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
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Notifikasi Pengingat</span>
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
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm mb-5">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            <li>
              <NavLink to="/kalender" className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  </div>
                  <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">Kalender Akademik</span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/tugas" className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">assignment_ind</span>
                  </div>
                  <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">Manajemen Tugas Tambahan</span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </NavLink>
            </li>
            <li>
              <button onClick={handleOpenSignatureModal} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">draw</span>
                  </div>
                  <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">Manajemen Tanda Tangan</span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </button>
            </li>
            <li>
              <div>
                <button onClick={handleSyncClick} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${syncStatus === 'syncing' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600' : syncStatus === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : syncStatus === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <span className={`material-symbols-outlined text-[16px] ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>sync</span>
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200 block">Sinkronisasi Data</span>
                      {syncUser && (
                        <span className="text-[10px] text-slate-400 font-medium">Server: {syncUser.nip}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {syncStatus === 'syncing' && (
                      <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-md">Syncing...</span>
                    )}
                    {syncStatus === 'success' && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">✓ Berhasil</span>
                    )}
                    {syncStatus === 'error' && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">Gagal</span>
                    )}
                    {syncStatus === 'idle' && lastSyncDate && (
                      <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-md">
                        {new Date(lastSyncDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {syncStatus === 'idle' && !lastSyncDate && !syncUser && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">Belum diatur</span>
                    )}
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
                  </div>
                </button>
                {syncUser && (
                  <div className="px-4 pb-2.5 -mt-1 pl-[52px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); executeSync(true); }}
                      className="text-[10px] text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[12px]">refresh</span>
                      Bermasalah? Paksa kirim ulang semua data
                    </button>
                  </div>
                )}
              </div>
            </li>
            {syncUser && (
            <>
            <li>
              <button onClick={handleSyncLogout} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">link_off</span>
                  </div>
                  <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">Putus Koneksi Server</span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-red-500 transition-colors">chevron_right</span>
              </button>
            </li>
            </>
            )}
            <li>
              <button 
                onClick={async () => {
                  showToast('Menarik data referensi...');
                  const result = await useAppStore.getState().pullReferensiData();
                  if (result) {
                    showToast(`Referensi diperbarui! ${result.kegiatan} KBM, ${result.tugas} Tugas, ${result.kalender} Status, ${result.jadwalKalender} Jadwal`, 'success');
                  } else {
                    showToast('Gagal menarik referensi', 'error');
                  }
                }} 
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200 block">Perbarui Referensi Data Sekolah</span>
                    <span className="text-[10px] text-slate-400">Unduh master data terbaru dari Admin</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-indigo-600 transition-colors">chevron_right</span>
              </button>
            </li>
            <li>
              <button onClick={() => useAppStore.getState().setBantuanOpen(true)} className="w-full text-left flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">help</span>
                  </div>
                  <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">Bantuan & Panduan LKD</span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-cyan-600 transition-colors">chevron_right</span>
              </button>
            </li>
          </ul>
        </section>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Keluar dari Aplikasi
        </button>

      </main>

      {/* Modal Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100">
                {editMode === 'profil' ? 'Edit Profil' : 'Data Kepala Sekolah'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors flex items-center justify-center w-6 h-6">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveProfil} className="p-3 space-y-2.5 bg-white dark:bg-slate-900">
              {editMode === 'profil' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Lengkap</label>
                    <input 
                      type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">NIP</label>
                    <input 
                      type="text" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Jabatan</label>
                    <input 
                      type="text" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pangkat</label>
                      <input 
                        type="text" value={formData.pangkat} onChange={e => setFormData({...formData, pangkat: e.target.value})}
                        className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Golongan</label>
                      <input 
                        type="text" value={formData.golongan} onChange={e => setFormData({...formData, golongan: e.target.value})}
                        className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Kepala Sekolah</label>
                    <input 
                      type="text" value={formData.namaKepsek} onChange={e => setFormData({...formData, namaKepsek: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">NIP Kepala Sekolah</label>
                    <input 
                      type="text" value={formData.nipKepsek} onChange={e => setFormData({...formData, nipKepsek: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[12px] font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button type="submit" className="w-full bg-cyan-600 text-white font-bold text-[12px] py-2 rounded-lg hover:bg-cyan-700 active:scale-95 transition-all shadow-lg shadow-cyan-900/20">
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
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-manrope font-bold text-[13px] text-slate-800 dark:text-slate-100">Tanda Tangan Digital</h2>
              <button onClick={() => setIsSignatureModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-full p-1.5 transition-colors flex items-center justify-center w-6 h-6">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950">
              <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-widest text-center">Goreskan Tanda Tangan</p>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl overflow-hidden touch-none relative">
                <canvas ref={canvasRef} width={350} height={180} className="w-full h-[180px] cursor-crosshair" onMouseDown={startDrawing} onMouseUp={endDrawing} onMouseOut={endDrawing} onMouseMove={draw} onTouchStart={startDrawing} onTouchEnd={endDrawing} onTouchMove={draw} />
              </div>
              <div className="flex gap-2 mt-2.5">
                <button onClick={clearSignature} type="button" className="flex-1 bg-red-50 text-red-600 font-bold text-[12px] py-2 rounded-lg hover:bg-red-100 active:scale-95 transition-all">Hapus</button>
                <button onClick={saveSignature} type="button" className="flex-[2] bg-emerald-600 text-white font-bold text-[12px] py-2 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-900/20">Simpan Tanda Tangan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Fallback Modal */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="px-4 py-3 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-manrope font-bold text-[15px] text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-teal-500">install_mobile</span>
                Cara Install LKD
              </h3>
              <button onClick={() => setIsInstallModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-4 space-y-3 text-slate-600 dark:text-slate-300 text-[12px]">
              <p>Ikuti panduan manual ini:</p>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-[12px] text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">Chrome (Android)</h4>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                  <li>Ketuk ikon <span className="font-bold">⋮</span> di pojok kanan atas.</li>
                  <li>Pilih <span className="font-bold text-teal-600">"Tambahkan ke Layar Utama"</span>.</li>
                  <li>Ketuk "Tambah".</li>
                </ol>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-[12px] text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">Safari (iPhone)</h4>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                  <li>Ketuk ikon Bagikan <span className="inline-block border border-slate-400 px-0.5 rounded mx-0.5">↑</span>.</li>
                  <li>Pilih <span className="font-bold text-teal-600">"Tambah ke Layar Utama"</span>.</li>
                  <li>Ketuk "Tambah".</li>
                </ol>
              </div>
              <button onClick={() => setIsInstallModalOpen(false)} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-[13px] font-bold transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Auth Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-manrope font-bold text-[15px] text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-cyan-600">cloud_sync</span>
                {syncIsRegister ? 'Daftar Akun Sync' : 'Login Server Sync'}
              </h2>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 rounded-full p-1.5 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="px-4 py-2.5 bg-cyan-50/50 dark:bg-cyan-950/20 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-cyan-500 shrink-0 mt-0.5">info</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">Hubungkan data LKD ke server agar bisa diakses di perangkat lain.</p>
              </div>
            </div>
            
            <form onSubmit={handleSyncAuth} className="p-4 space-y-3 bg-white dark:bg-slate-900">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">NIP</label>
                <input 
                  type="text" value={syncForm.nip} onChange={e => setSyncForm({...syncForm, nip: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none"
                  required
                />
              </div>
              {syncIsRegister && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Lengkap</label>
                  <input 
                    type="text" value={syncForm.nama} onChange={e => setSyncForm({...syncForm, nama: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Password Sinkronisasi</label>
                <input 
                  type="password" value={syncForm.password} onChange={e => setSyncForm({...syncForm, password: e.target.value})}
                  placeholder="Buat password untuk akun sync"
                  className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] font-semibold focus:ring-2 focus:ring-cyan-500/50 outline-none placeholder:font-normal"
                  required minLength={4}
                />
              </div>

              {syncMessage && syncStatus === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {syncMessage}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button 
                  type="submit" disabled={syncStatus === 'syncing'}
                  className="w-full bg-cyan-600 text-white font-bold text-[13px] py-2.5 rounded-lg hover:bg-cyan-700 active:scale-95 transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {syncStatus === 'syncing' && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                  {syncIsRegister ? 'Daftar & Sinkronkan' : 'Login & Sinkronkan'}
                </button>
                <button type="button" onClick={() => setSyncIsRegister(!syncIsRegister)} className="w-full text-[12px] font-semibold text-slate-500 hover:text-cyan-600 transition-colors py-1.5">
                  {syncIsRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
                </button>
              </div>
            </form>
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
