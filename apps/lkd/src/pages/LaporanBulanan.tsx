import { useMemo, useState, useEffect } from 'react';
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
  
  const formatterBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  const namaBulanThn = `${formatterBulan.format(new Date(activeYear, activeMonthIndex))} ${activeYear}`;
  const formatterTanggalLengkap = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // State for Pengesahan
  const [tempat, setTempat] = useState('Lombok Timur');
  const [tglPengesahan, setTglPengesahan] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Sync default date when month/year changes
  useEffect(() => {
    const lastDay = new Date(activeYear, activeMonthIndex + 1, 0);
    const y = lastDay.getFullYear();
    const m = (lastDay.getMonth() + 1).toString().padStart(2, '0');
    const d = lastDay.getDate().toString().padStart(2, '0');
    setTglPengesahan(`${y}-${m}-${d}`);
  }, [activeMonthIndex, activeYear]);

  const formattedTglPengesahan = tglPengesahan 
    ? formatterTanggalLengkap.format(new Date(tglPengesahan))
    : formatterTanggalLengkap.format(new Date(activeYear, activeMonthIndex + 1, 0));

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

  const exportToExcel = () => {
    const tdBorder = 'border: .5pt solid windowtext;';
    const excelHtml = `
      <table>
        <tr>
          <th colspan="4" class="text-center bold" style="font-size: 14pt;">Bulan ${namaBulanThn}</th>
        </tr>
        <tr><td colspan="4"></td></tr>
        <tr>
          <td style="${tdBorder}">Nama</td>
          <td colspan="3" style="${tdBorder}">${profil?.nama || '-'}</td>
        </tr>
        <tr>
          <td style="${tdBorder}">NIP</td>
          <td colspan="3" style="${tdBorder} mso-number-format:'\\@'">${profil?.nip || '-'}</td>
        </tr>
        <tr>
          <td style="${tdBorder}">Pangkat / Gol</td>
          <td colspan="3" style="${tdBorder}">${profil?.pangkat || '-'} / ${profil?.golongan || '-'}</td>
        </tr>
        <tr>
          <td style="${tdBorder}">Jabatan</td>
          <td colspan="3" style="${tdBorder}">${profil?.jabatan || '-'}</td>
        </tr>
        <tr>
          <td style="${tdBorder}">Unit Kerja</td>
          <td colspan="3" style="${tdBorder}">MAN 2 Lombok Timur</td>
        </tr>
        <tr><td colspan="4"></td></tr>
        
        <tr>
          <th style="${tdBorder}" class="text-center bold">No.</th>
          <th style="${tdBorder}" class="text-left bold">Kegiatan</th>
          <th style="${tdBorder}" class="text-left bold">Pekerjaan</th>
          <th style="${tdBorder}" class="text-center bold">Tanggal</th>
        </tr>
        ${groupedLkh && groupedLkh.length > 0 ? groupedLkh.map((group, groupIndex) => 
          group.items.map((item, itemIndex) => `
            <tr>
              ${itemIndex === 0 ? `<td rowspan="${group.items.length}" style="${tdBorder}" class="text-center valign-top">${groupIndex + 1}</td>` : ''}
              <td style="${tdBorder}" class="valign-top">${item.kegiatan}</td>
              <td style="${tdBorder}" class="valign-top">${item.uraian}</td>
              ${itemIndex === 0 ? `<td rowspan="${group.items.length}" style="${tdBorder}" class="text-center valign-top">${group.formattedDate}</td>` : ''}
            </tr>
          `).join('')
        ).join('') : `
          <tr><td colspan="4" style="${tdBorder}" class="text-center">Belum ada data kegiatan untuk bulan ini.</td></tr>
        `}
        
        <tr><td colspan="4"></td></tr>
        <tr><td colspan="4"></td></tr>
        <tr>
          <td colspan="3">Mengetahui,</td>
          <td>${tempat}, ${formattedTglPengesahan}</td>
        </tr>
        <tr>
          <td colspan="3">Kepala Sekolah / Madrasah</td>
          <td>Pegawai yang dinilai</td>
        </tr>
        <tr><td colspan="4"></td></tr>
        <tr><td colspan="4"></td></tr>
        <tr><td colspan="4"></td></tr>
        <tr>
          <td colspan="3">${profil?.namaKepsek || '-'}</td>
          <td>${profil?.nama || '-'}</td>
        </tr>
        <tr>
          <td colspan="3" style='mso-number-format:"\\@"'>NIP. ${profil?.nipKepsek || '-'}</td>
          <td style='mso-number-format:"\\@"'>NIP. ${profil?.nip || '-'}</td>
        </tr>
      </table>
    `;

    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Laporan Kinerja</title>
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
      td, th { padding: 5px; }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .bold { font-weight: bold; }
      .valign-top { vertical-align: top; }
    </style>
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Laporan Kinerja</x:Name>
    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
    </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    </head><body>`;
    
    const postHtml = "</body></html>";
    const html = preHtml + excelHtml + postHtml;

    const url = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
    const filename = `LKH_${profil?.nama || 'Pegawai'}_${namaBulanThn.replace(' ', '_')}.xls`;
    
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const groupedLkh = useMemo(() => {
    if (!lkhData) return [];
    const groups: Record<string, typeof lkhData> = {};
    lkhData.forEach(item => {
      if (!groups[item.tanggal]) {
        groups[item.tanggal] = [];
      }
      groups[item.tanggal].push(item);
    });
    
    return Object.keys(groups).sort().map(tanggal => {
      const dateObj = new Date(tanggal);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return {
        tanggal,
        formattedDate: `${day}-${month}-${year}`,
        items: groups[tanggal]
      };
    });
  }, [lkhData]);

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
        
        {/* Settings & Print Action Buttons */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          {/* Custom Date Pengesahan */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 w-full md:w-auto">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">edit_calendar</span>
            <input 
              type="text" 
              value={tempat} 
              onChange={e => setTempat(e.target.value)} 
              className="w-24 text-xs font-bold bg-transparent outline-none text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 pr-2"
              placeholder="Tempat"
            />
            <input 
              type="date" 
              value={tglPengesahan} 
              onChange={e => setTglPengesahan(e.target.value)} 
              className="text-xs font-bold bg-transparent outline-none text-slate-700 dark:text-slate-200 pl-1 uppercase"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <NavLink to="/lkh/riwayat" className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-label text-sm font-bold text-primary hover:bg-surface-variant transition-colors border border-outline-variant/30">
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              <span className="hidden md:inline">Edit</span>
            </NavLink>
            
            <div className="relative flex-1 md:flex-none">
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-label text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span className="hidden md:inline">Export</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              
              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[120]" onClick={() => setIsExportMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl shadow-teal-900/10 z-[130] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => { exportToWord(); setIsExportMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
                    >
                      <span className="material-symbols-outlined text-blue-600">description</span>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Microsoft Word</div>
                        <div className="text-[10px] font-semibold text-slate-500">Format .doc</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => { exportToExcel(); setIsExportMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="material-symbols-outlined text-green-600">table</span>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Microsoft Excel</div>
                        <div className="text-[10px] font-semibold text-slate-500">Format .xls</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => window.print()}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl font-label text-sm font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Cetak PDF
            </button>
          </div>
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
            {groupedLkh && groupedLkh.length > 0 ? (
              groupedLkh.map((group, groupIndex) => (
                group.items.map((item, itemIndex) => (
                  <tr key={item.id}>
                    {itemIndex === 0 && (
                      <td rowSpan={group.items.length} className="border border-black px-2 py-3 text-center align-top">{groupIndex + 1}</td>
                    )}
                    <td className="border border-black px-2 py-3 align-top break-words">
                      {item.kegiatan}
                    </td>
                    <td className="border border-black px-2 py-3 align-top break-words">
                      {item.uraian}
                    </td>
                    {itemIndex === 0 && (
                      <td rowSpan={group.items.length} className="border border-black px-2 py-3 text-center align-top break-words">
                        {group.formattedDate}
                      </td>
                    )}
                  </tr>
                ))
              ))
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
          {/* Left Signature: Kepala Sekolah */}
          <div className="text-center flex flex-col items-center justify-between w-64">
            <div>
              <p className="mb-2 text-transparent select-none">Spacer</p> {/* Invisible spacer to align vertically with date on the right */}
              <p className="mb-2">Mengetahui,</p>
              <p className="font-bold mb-4">Kepala Sekolah / Madrasah</p>
            </div>
            <div className="h-20 w-full flex items-center justify-center">
              {/* Empty area for manual signature / future kepsek signature */}
            </div>
            <div className="w-full">
              <p className="font-bold border-b border-black pb-1 inline-block uppercase">{profil?.namaKepsek || '-'}</p>
              <p className="mt-1">NIP. {profil?.nipKepsek || '-'}</p>
            </div>
          </div>
          
          {/* Right Signature: Pegawai */}
          <div className="text-center flex flex-col items-center justify-between w-64">
            <div>
              <p className="mb-2">{tempat}, {formattedTglPengesahan}</p>
              <p className="mb-2 text-transparent select-none">Spacer</p> {/* Vertical balancer */}
              <p className="font-bold mb-4">Pegawai yang dinilai</p>
            </div>
            <div className="h-20 w-full flex items-center justify-center">
              {profil?.ttdUrl && profil.ttdUrl.startsWith('data:image') && (
                <img src={profil.ttdUrl} alt="Tanda Tangan" className="h-16 object-contain mix-blend-multiply" />
              )}
            </div>
            <div className="w-full">
              <p className="font-bold border-b border-black pb-1 inline-block uppercase">{profil?.nama || '-'}</p>
              <p className="mt-1">NIP. {profil?.nip || '-'}</p>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
