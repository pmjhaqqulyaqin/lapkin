import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { isSyncConfigured, fullSync, getLastSyncTimestamp } from '../db/syncEngine';
import { useAppStore } from '../store/useAppStore';

export default function SyncActionBadge() {
  const showToast = useAppStore(state => state.showToast);
  const [isSyncing, setIsSyncing] = useState(false);
  // Generation counter — incremented after each sync to force useLiveQuery re-evaluation
  const [syncGen, setSyncGen] = useState(0);

  // Periksa apakah sinkronisasi sudah diatur
  const isConfigured = isSyncConfigured();

  // Gunakan LiveQuery untuk memantau perubahan data
  const hasUnsyncedChanges = useLiveQuery(async () => {
    if (!isConfigured) return false;
    
    const lastSync = getLastSyncTimestamp();
    
    // Jika belum pernah sync, tapi ada data
    if (lastSync === 0) {
      const profil = await db.profil.get(1);
      if (profil && profil.updatedAt && profil.updatedAt > 0) return true;
      if (await db.lkh.count() > 0) return true;
      if (await db.jadwal.count() > 0) return true;
      if (await db.tugasTambahan.count() > 0) return true;
      const kalender = await db.kalender.toArray();
      if (kalender.some(k => !k.isGlobal)) return true;
      return false;
    }

    // Periksa apakah ada data yang diperbarui SETELAH lastSync
    const p = await db.profil.get(1);
    if (p && p.updatedAt && p.updatedAt > lastSync) return true;

    if (await db.lkh.where('updatedAt').above(lastSync).count() > 0) return true;
    if (await db.jadwal.where('updatedAt').above(lastSync).count() > 0) return true;
    if (await db.tugasTambahan.where('updatedAt').above(lastSync).count() > 0) return true;
    
    // Untuk kalender, kita abaikan perubahan yang sifatnya global (isGlobal=1)
    const kalenderBaru = await db.kalender.where('updatedAt').above(lastSync).toArray();
    if (kalenderBaru.some(k => !k.isGlobal)) return true;

    return false;
  }, [isConfigured, syncGen]);

  const handleSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) {
      if (!navigator.onLine) showToast('Koneksi internet terputus.', 'error');
      return;
    }

    setIsSyncing(true);
    showToast('Sinkronisasi dimulai...', 'info');

    try {
      const result = await fullSync();
      // Tarik juga referensi data jika diperlukan
      await useAppStore.getState().pullReferensiData();

      // Re-update lastSync timestamp SETELAH pullReferensiData
      // agar data global kalender yang baru ditulis tidak dianggap "unsynced"
      const currentLastSync = getLastSyncTimestamp();
      if (currentLastSync > 0) {
        localStorage.setItem('lkd_last_sync', String(Date.now()));
      }

      // Increment generation agar useLiveQuery membaca ulang lastSync terbaru
      setSyncGen(g => g + 1);
      
      showToast(`Sinkronisasi berhasil! (↑${result.pushed} ↓${result.pulled})`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal sinkronisasi. Coba lagi nanti.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, showToast]);

  // Sembunyikan jika user belum mengaktifkan sync
  if (!isConfigured) return null;

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      title={hasUnsyncedChanges ? "Ada perubahan belum tersinkronisasi" : "Data tersinkronisasi"}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-900/5 hover:bg-cyan-900/10 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 group border border-transparent hover:border-cyan-200 dark:hover:border-slate-600 disabled:opacity-50"
    >
      <span className={`material-symbols-outlined text-[20px] text-cyan-700 dark:text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`}>
        cloud_sync
      </span>
      
      {/* Smart Indicator: Muncul jika ada perubahan lokal yang belum dikirim */}
      {hasUnsyncedChanges && !isSyncing && (
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
      )}
    </button>
  );
}
