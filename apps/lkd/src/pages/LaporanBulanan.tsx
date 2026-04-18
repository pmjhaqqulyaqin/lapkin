import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';

export default function LaporanBulanan() {
  const { activeMonthIndex, activeYear, setActiveMonthYear } = useAppStore();

  const profil = useLiveQuery(() => db.profil.get(1));
  const lkhData = useLiveQuery(() => 
    db.lkh.orderBy('tanggal').toArray().then(arr => 
      arr.filter((l) => {
        const d = new Date(l.tanggal);
        return d.getMonth() === activeMonthIndex && d.getFullYear() === activeYear;
      })
    ), [activeMonthIndex, activeYear]
  );

  const lastDayOfMonth = new Date(activeYear, activeMonthIndex + 1, 0);
  
  const formatterBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  const namaBulanThn = `${formatterBulan.format(new Date(activeYear, activeMonthIndex))} ${activeYear}`;
  const formatterTanggalLengkap = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const exportToWord = () => {
    const printContent = document.getElementById('print-area')?.innerHTML;
    if (!printContent) return;

    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Laporan Kinerja</title>
    <style>
      table { border-collapse: collapse; width: 100%; table-layout: fixed; }
      table, th, td { border: 1px solid black; }
      th, td { padding: 6px; text-align: left; word-wrap: break-word; }
      th { background-color: transparent; font-weight: bold; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
    </style>
    </head><body>`;
    const postHtml = "</body></html>";
    const html = preHtml + printContent + postHtml;

    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    const filename = `LKH_${profil?.nama || 'Pegawai'}_${namaBulanThn.replace(' ', '_')}.doc`;
    
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <>
      {/* TopAppBar / Action Bar (Hidden when printing) */}
      <header className="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md text-cyan-950 dark:text-cyan-50 docked full-width top-0 sticky z-50 no-border shadow-sm shadow-cyan-900/5 flex flex-col md:flex-row justify-between items-start md:items-center w-full px-4 md:px-6 py-4 mx-auto no-print gap-4">
        <div className="flex items-center gap-3">
          <NavLink to="/dashboard" className="text-cyan-950 dark:text-cyan-50 bg-cyan-900/5 hover:bg-cyan-900/10 p-2 rounded-full active:scale-95 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </NavLink>
          <div>
            <h1 className="font-manrope font-bold text-lg md:text-xl tracking-tight leading-none">Preview Laporan</h1>
            <div className="flex items-center gap-2 mt-1">
              <select 
                value={activeMonthIndex}
                onChange={(e) => setActiveMonthYear(Number(e.target.value), activeYear)}
                className="text-xs font-semibold bg-transparent border-none p-0 outline-none cursor-pointer hover:opacity-80"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{formatterBulan.format(new Date(2026, i))}</option>
                ))}
              </select>
              <select 
                value={activeYear}
                onChange={(e) => setActiveMonthYear(activeMonthIndex, Number(e.target.value))}
                className="text-xs font-semibold bg-transparent border-none p-0 outline-none cursor-pointer hover:opacity-80"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Print & Action Buttons */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <NavLink to="/lkh/riwayat" className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-label text-sm font-bold text-primary hover:bg-surface-variant transition-colors border border-outline-variant/30">
            <span className="material-symbols-outlined text-[18px]">edit_document</span>
            <span className="hidden md:inline">Edit Laporan</span>
          </NavLink>
          <button onClick={exportToWord} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-label text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">description</span>
            <span className="hidden md:inline">Export Word</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-label text-sm font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Cetak PDF
          </button>
        </div>
      </header>

      {/* A4 Paper Container for Printing */}
      <main id="print-area" className="max-w-[210mm] mx-auto bg-white my-8 md:my-12 shadow-2xl p-4 sm:p-8 md:p-12 min-h-[297mm] text-black print-area print:max-w-none print:w-full print:m-0 print:p-0 print:shadow-none">
        
        {/* Report Header / Kop Identitas */}
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          <h2 className="font-bold text-lg uppercase tracking-wider mb-1">Laporan Kinerja Bulanan</h2>
          <h3 className="font-semibold text-base uppercase">Bulan {namaBulanThn}</h3>
        </div>

        {/* User Identity Info */}
        <div className="mb-8">
          <table className="text-sm font-medium w-full max-w-2xl">
            <tbody>
              <tr>
                <td className="py-1.5 w-32 uppercase tracking-wide">Nama</td>
                <td className="py-1.5 px-2">:</td>
                <td className="py-1.5 font-bold text-base">{profil?.nama || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 uppercase tracking-wide">NIP</td>
                <td className="py-1.5 px-2">:</td>
                <td className="py-1.5">{profil?.nip || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 uppercase tracking-wide">Pangkat / Gol</td>
                <td className="py-1.5 px-2">:</td>
                <td className="py-1.5">{profil?.pangkat || '-'} / {profil?.golongan || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 uppercase tracking-wide">Jabatan</td>
                <td className="py-1.5 px-2">:</td>
                <td className="py-1.5">{profil?.jabatan || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 uppercase tracking-wide">Unit Kerja</td>
                <td className="py-1.5 px-2">:</td>
                <td className="py-1.5">MAN 2 Lombok Timur</td>
              </tr>
            </tbody>
          </table>
        </div>

        <table className="w-full border-collapse border border-black text-sm mb-12 table-fixed print:w-full">
          <thead>
            <tr className="bg-gray-100 print:bg-transparent">
              <th className="border border-black px-2 py-3 w-[8%] text-center font-bold">No.</th>
              <th className="border border-black px-2 py-3 w-[25%] font-bold text-left">Kegiatan</th>
              <th className="border border-black px-2 py-3 w-[47%] font-bold text-left">Pekerjaan</th>
              <th className="border border-black px-2 py-3 w-[20%] font-bold text-center">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {lkhData && lkhData.length > 0 ? (
              lkhData.map((item, index) => {
                const dateObj = new Date(item.tanggal);
                const day = dateObj.getDate().toString().padStart(2, '0');
                const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const year = dateObj.getFullYear();
                const formattedDate = `${day}- ${month}- ${year}`;
                return (
                  <tr key={item.id}>
                    <td className="border border-black px-2 py-3 text-center align-top">{index + 1}</td>
                    <td className="border border-black px-2 py-3 align-top break-words">
                      {item.kegiatan}
                    </td>
                    <td className="border border-black px-2 py-3 align-top break-words">
                      {item.uraian}
                    </td>
                    <td className="border border-black px-2 py-3 text-center align-top whitespace-nowrap">
                      {formattedDate}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="border border-black px-4 py-12 text-center text-gray-500 italic">
                  Belum ada data kegiatan untuk bulan ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Signature Area */}
        <div className="flex justify-between mt-12 page-break-inside-avoid">
          <div className="text-center flex flex-col items-center">
            <p className="mb-2">Mengetahui,</p>
            <p className="font-bold mb-16">Kepala Sekolah / Madrasah</p>
            <p className="font-bold border-b border-black pb-1 inline-block uppercase">{profil?.namaKepsek || '-'}</p>
            <p className="mt-1">NIP. {profil?.nipKepsek || '-'}</p>
          </div>
          
          <div className="text-center flex flex-col items-center justify-between">
            <p className="mb-2">Lombok Timur, {formatterTanggalLengkap.format(lastDayOfMonth)}</p>
            <p className="font-bold mb-4">Pegawai yang dinilai</p>
            {profil?.ttdUrl && profil.ttdUrl.startsWith('data:image') ? (
              <img src={profil.ttdUrl} alt="Tanda Tangan" className="h-16 object-contain mix-blend-multiply mb-2" />
            ) : (
              <div className="h-20"></div> // Spacer if no signature
            )}
            <div>
              <p className="font-bold border-b border-black pb-1 inline-block uppercase">{profil?.nama || '-'}</p>
              <p className="mt-1">NIP. {profil?.nip || '-'}</p>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
