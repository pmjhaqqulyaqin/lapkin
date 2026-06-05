import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import JadwalMengajar from './JadwalMengajar';
import JadwalPegawai from './JadwalPegawai';

export default function JadwalRouter() {
  const profil = useLiveQuery(() => db.profil.get(1));

  // Loading state — profil belum dimuat
  if (profil === undefined) {
    return (
      <>
        <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
          <div className="flex justify-between items-center w-full px-4 py-3 max-w-5xl mx-auto">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          </div>
        </header>
        <main className="pt-16 px-4 max-w-3xl mx-auto">
          <div className="flex gap-2 mb-6 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </main>
      </>
    );
  }

  // Deteksi role: jika jabatan mengandung "guru" (case-insensitive) → guru, selainnya → pegawai
  const isGuru = profil?.jabatan?.toLowerCase().includes('guru');

  return isGuru ? <JadwalMengajar /> : <JadwalPegawai />;
}
