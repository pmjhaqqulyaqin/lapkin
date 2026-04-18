import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const FAQ_DATA = [
  {
    q: 'Bagaimana cara mencetak Laporan?',
    a: 'Buka menu Dasbor, lalu ketuk tombol "Cetak Laporan Bulan Ini" di bagian bawah. Setelah halaman Preview muncul, Anda dapat menyesuaikan Tanggal Pengesahan, lalu klik tombol "Cetak PDF" atau "Export Word".'
  },
  {
    q: 'Bagaimana mengubah data Atasan/Kepala Sekolah?',
    a: 'Masuk ke menu Profil, temukan kotak "Kepala Sekolah", lalu klik "Ubah Data Atasan". Jangan lupa simpan perubahan setelah mengedit.'
  },
  {
    q: 'Apakah data saya aman jika tidak ada sinyal internet?',
    a: 'Tentu saja! Aplikasi LKD ini mengutamakan mode Offline (Offline-first). Semua input kinerja harian Anda tersimpan dengan aman di penyimpanan lokal (browser) perangkat Anda, sehingga Anda bisa membuat laporan meskipun tanpa internet.'
  },
  {
    q: 'Bagaimana cara memasukkan Tanda Tangan Digital?',
    a: 'Buka menu Profil, lalu ketuk "Manajemen Tanda Tangan". Anda dapat memfoto tanda tangan Anda di atas kertas putih dan mengunggahnya. Sistem akan menghapus latar belakang putihnya secara otomatis.'
  },
  {
    q: 'Bagaimana cara kerja Sinkronisasi?',
    a: 'Fitur Sinkronisasi memungkinkan Anda mem-backup data lokal ke server pusat atau memindahkannya ke perangkat lain (misalnya dari HP ke Laptop). Fitur ini sedang dalam tahap pengembangan akhir dan akan segera dirilis.'
  },
  {
    q: 'Solusi jika lupa menekan Simpan LKH',
    a: 'Aplikasi tidak menyimpan secara otomatis sebelum Anda menekan "Simpan LKH". Jika Anda belum menyimpannya, laporan hari tersebut belum masuk ke sistem. Pastikan untuk selalu menekan Simpan!'
  }
];

export default function BantuanModal() {
  const { isBantuanOpen, setBantuanOpen } = useAppStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Buka yang pertama secara default

  if (!isBantuanOpen) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm pt-10 pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-cyan-50 dark:bg-cyan-900/20 shrink-0">
          <h2 className="font-manrope font-bold text-lg text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-600">help</span>
            Bantuan & Panduan LKD
          </h2>
          <button onClick={() => setBantuanOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-2 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        {/* Body (Scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto min-h-0 space-y-3">
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Temukan jawaban untuk pertanyaan yang sering diajukan mengenai penggunaan Aplikasi Laporan Kinerja Digital (LKD) di bawah ini.
          </p>

          {FAQ_DATA.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-colors ${isOpen ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
              >
                <button 
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className={`font-bold text-sm leading-snug ${isOpen ? 'text-cyan-800 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {faq.q}
                  </span>
                  <span className={`material-symbols-outlined text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                
                {/* Expandable Content */}
                <div 
                  className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0 pb-0'}`}
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50 text-center">
          <p className="text-xs font-semibold text-slate-500">
            Masih mengalami kendala? Hubungi <span className="text-cyan-600 dark:text-cyan-400">Admin MAN 2 Lombok Timur</span>.
          </p>
        </div>

      </div>
    </div>
  );
}
