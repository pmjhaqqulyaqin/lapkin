import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const FAQ_DATA = [
  {
    q: 'Apakah aplikasi dapat digunakan tanpa kuota internet?',
    a: 'Tentu saja! Aplikasi LKD mengutamakan mode Offline (Offline-first). Anda bisa menginput Laporan Kinerja Harian (LKH) setiap hari meskipun tanpa koneksi internet. Data akan tersimpan dengan aman di browser perangkat Anda.'
  },
  {
    q: 'Bagaimana cara mem-backup data ke Cloud/Server Pusat?',
    a: 'Aplikasi kini dilengkapi fitur "Sinkronisasi Cloud". Buka halaman Dasbor, lalu ketuk tombol "Sinkronisasi" pada kartu status Cloud. Pastikan Anda memiliki koneksi internet dan akun yang telah terdaftar oleh Admin agar data Anda dapat tersimpan di server pusat dan diakses dari perangkat lain.'
  },
  {
    q: 'Bagaimana cara menambahkan Jadwal Mengajar & Tugas Tambahan?',
    a: 'Buka menu Dasbor, gulir ke bagian "Pintasan Cepat", lalu pilih "Jadwal Mengajar" atau "Tugas Tambahan". Anda dapat mengatur mata pelajaran, jam, kelas, serta tugas-tugas tambahan yang akan muncul secara otomatis sebagai pilihan cepat saat menginput LKH.'
  },
  {
    q: 'Bagaimana fungsi Kalender Akademik?',
    a: 'Kalender Akademik berfungsi sebagai pusat informasi agenda madrasah. Agenda global yang diset oleh Admin, maupun agenda pribadi yang Anda buat, akan otomatis muncul pada menu "Input LKH" di tanggal yang bersangkutan, sehingga Anda tidak perlu mengetik ulang aktivitas tersebut.'
  },
  {
    q: 'Bagaimana cara memasukkan Tanda Tangan Digital?',
    a: 'Buka menu Profil, gulir ke bawah dan ketuk tombol "Ubah Tanda Tangan". Anda dapat langsung menggoreskan tanda tangan digital pada layar perangkat menggunakan jari atau stylus.'
  },
  {
    q: 'Bagaimana prosedur mencetak Laporan Bulanan?',
    a: 'Buka menu "Laporan" pada bilah navigasi bawah. Pastikan semua entri LKH di bulan tersebut sudah lengkap. Tentukan tanggal pengesahan laporan, lalu ketuk "Tampilkan Dokumen". Setelah pratinjau muncul, pilih "Cetak PDF" untuk mencetak langsung, atau "Export Word" jika Anda perlu melakukan penyesuaian tata letak dokumen.'
  }
];

export default function BantuanModal() {
  const { isBantuanOpen, setBantuanOpen } = useAppStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Buka yang pertama secara default

  useEffect(() => {
    if (isBantuanOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isBantuanOpen]);

  if (!isBantuanOpen) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm pt-10 pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-cyan-50 dark:bg-cyan-900/20 shrink-0">
          <h2 className="font-manrope font-bold text-[13px] text-cyan-900 dark:text-cyan-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-cyan-600">help</span>
            Bantuan & Panduan LKD
          </h2>
          <button onClick={() => setBantuanOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors shadow-sm flex items-center justify-center w-6 h-6">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
        
        {/* Body (Scrollable) */}
        <div className="p-3 flex-1 overflow-y-auto min-h-0 space-y-2.5 custom-scrollbar">
          
          {/* Deskripsi Aplikasi */}
          <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800/30 rounded-lg p-2.5">
             <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
               <strong className="text-cyan-800 dark:text-cyan-400">Aplikasi Laporan Kinerja Digital (LKD)</strong> adalah platform web progresif (PWA) cerdas yang dirancang khusus untuk mempermudah Guru dan Tenaga Kependidikan dalam mencatat, mengelola, serta melaporkan kinerja harian secara efisien. Aplikasi ini didesain unggul dengan fitur pengisian *offline*, sinkronisasi data seketika (Cloud), integrasi kalender akademik, hingga pencetakan laporan bulanan instan beserta validasi tanda tangan digital.
             </p>
          </div>

          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1 mt-3">
            Panduan & Pertanyaan Umum
          </p>

          <div className="space-y-2">
            {FAQ_DATA.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg overflow-hidden transition-colors ${isOpen ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                >
                  <button 
                    onClick={() => toggleAccordion(index)}
                    className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className={`font-bold text-[12px] leading-snug ${isOpen ? 'text-cyan-800 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {faq.q}
                    </span>
                    <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  
                  {/* Expandable Content */}
                  <div 
                    className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 pb-3' : 'max-h-0 opacity-0 pb-0'}`}
                  >
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800/50 text-justify">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer & Tim Pengembang */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-2">
          <p className="text-[10px] font-bold text-slate-500 text-center">
            Masih mengalami kendala? Hubungi <span className="text-cyan-600 dark:text-cyan-400">Admin MAN 2 Lombok Timur</span>.
          </p>
          
          <div className="w-full border-t border-slate-200 dark:border-slate-700/50"></div>
          
          <div className="text-center">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Tim Pengembang Aplikasi
            </p>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              Muhammad Yusri, Tim IT Mandalotim<br/>
              <span className="text-slate-500">Didukung oleh Humas Mandalotim</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
